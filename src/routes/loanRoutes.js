const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

router.get('/', loanController.getAllLoans);
router.post('/issue', loanController.issueBook);
router.post('/:id/return', loanController.returnBook);
router.post('/:id/renew', loanController.renewLoan);
router.post('/:id/pay-fine', loanController.payFine);

module.exports = router;
