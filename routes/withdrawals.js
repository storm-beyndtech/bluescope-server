import express from 'express';
import { Transaction } from '../models/transaction.js';
import { User } from '../models/user.js';
import { alertAdmin, withdrawalMail } from '../utils/mailer.js';


const router  = express.Router()



// getting all withdrawals
router.get('/', async(req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: "withdrawal" })
    res.send(withdrawals)
  } catch(e){ for(i in e.errors) res.status(500).send({message: e.errors[i].message}) }
})


// getting single withdrawal
router.get('/:id', async(req, res) => {
  const { id } = req.params
  
  try {
    const withdrawal = await Transaction.findById(id)
    if(!withdrawal) return res.status(400).send({message: "Transaction not found..."})
    res.send(withdrawal);
  }
  catch(e){ for(i in e.errors) res.status(500).send({message: e.errors[i].message}) }
})



// get all withdrawals by user
router.get('/user/:email', async(req, res) => {
  const { email } = req.params

  try {
    const withdrawals = await Transaction.find({ from: email });
    if (!withdrawals || withdrawals.length === 0) return res.status(400).send({message: "Transactions not found..."})
    res.send(withdrawals);
  }
  catch(e){ for(i in e.errors) res.status(500).send({message: e.errors[i].message}) }
})


// making a withdrawal
router.post('/', async (req, res) => {
  const { id, amount, convertedAmount, coinName, network, address } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(400).send({ message: 'Something went wrong' });

  // Check if there's any pending withdrawal for the user
  const pendingWithdrawal = await Transaction.findOne({
    'user.id': id,
    status: 'pending',
    type: 'withdrawal',
  });

  if (pendingWithdrawal) {
    return res.status(400).send({ message: 'You have a pending withdrawal. Please wait for approval.' });
  }

  try {
    const userData = {
      id: user._id,
      email: user.email,
      name: user.fullName,
    };

    const walletData = {
      convertedAmount,
      coinName,
      network,
      address,
    };

    // Create a new withdrawal instance
    const transaction = new Transaction({ type: 'withdrawal', user: userData, amount, walletData });
    await transaction.save();

    const date = transaction.date;
    const type = transaction.type;
    const email = transaction.user.email;

    const emailData = await alertAdmin(email, amount, date, type);
    if (emailData.error) return res.status(400).send({ message: emailData.error });

    res.send({ message: 'Withdraw successful and pending approval...' });
  } catch (e) {
    for (i in e.errors) res.status(500).send({ message: e.errors[i].message });
  }
});



// updating a withdrawal
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { email, amount, status } = req.body;

  let withdrawal = await Transaction.findById(id);
  if (!withdrawal) return res.status(404).send({ message: 'Deposit not found' });

  let user = await User.findOne({ email });
  if (!user) return res.status(400).send({ message: 'Something went wrong' });

  try {
    withdrawal.status = status;

    if (status === 'success') {
      user.withdraw += amount;
    }

    user = await user.save()
    withdrawal = await withdrawal.save()

    const { fullName, email } = user;
    const { date } = withdrawal;

    const emailData = await withdrawalMail(fullName, amount, date, email);
    if (emailData.error) return res.status(400).send({ message: emailData.error });

    res.send({ message: 'Withdrawal successfully updated' });
  } catch (e) {
    for (i in e.errors) res.status(500).send({ message: e.errors[i].message });
  }
});



export default router;



