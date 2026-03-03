function calculateTotal(transactions) {
    return transactions.reduce((total, txn) => total + txn.amount, 0);
}