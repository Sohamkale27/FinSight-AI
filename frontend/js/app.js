document.addEventListener("DOMContentLoaded", function () {

    const incomeInput = document.getElementById("incomeInput");
    const setIncomeBtn = document.getElementById("setIncomeBtn");

    const expenseNameInput = document.getElementById("expenseName");
    const expenseAmountInput = document.getElementById("expenseAmount");
    const addExpenseBtn = document.getElementById("addExpenseBtn");

    const expenseList = document.getElementById("expenseList");

    const totalExpenseDisplay = document.getElementById("totalExpense");
    const balanceDisplay = document.getElementById("balance");
    const savingsRateDisplay = document.getElementById("savingsRate");

    let income = parseFloat(localStorage.getItem("income")) || 0;
    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

    function saveData() {
        localStorage.setItem("income", income);
        localStorage.setItem("expenses", JSON.stringify(expenses));
    }

    function calculateTotalExpense() {
        return expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }

    function updateSummary() {
        const totalExpense = calculateTotalExpense();
        const balance = income - totalExpense;
        const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

        totalExpenseDisplay.textContent = totalExpense;
        balanceDisplay.textContent = balance;
        savingsRateDisplay.textContent = savingsRate;
    }

    function renderExpenses() {
        expenseList.innerHTML = "";

        expenses.forEach((expense, index) => {
            const li = document.createElement("li");
            li.classList.add("expense-item");

            li.innerHTML = `
                <span>${expense.name} - ₹ ${expense.amount}</span>
                <button class="delete-btn" data-index="${index}">Delete</button>
            `;

            expenseList.appendChild(li);
        });
    }

    setIncomeBtn.addEventListener("click", function () {
        income = parseFloat(incomeInput.value);

        if (isNaN(income) || income <= 0) {
            alert("Enter valid income");
            return;
        }

        saveData();
        updateSummary();
        incomeInput.value = "";
    });

    addExpenseBtn.addEventListener("click", function () {
        const name = expenseNameInput.value.trim();
        const amount = parseFloat(expenseAmountInput.value);

        if (name === "" || isNaN(amount)) {
            alert("Enter valid expense details");
            return;
        }

        expenses.push({ name, amount });

        saveData();
        renderExpenses();
        updateSummary();

        expenseNameInput.value = "";
        expenseAmountInput.value = "";
    });

    expenseList.addEventListener("click", function (e) {
        if (e.target.classList.contains("delete-btn")) {
            const index = e.target.getAttribute("data-index");

            expenses.splice(index, 1);

            saveData();
            renderExpenses();
            updateSummary();
        }
    });

    renderExpenses();
    updateSummary();

});
