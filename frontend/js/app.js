document.addEventListener("DOMContentLoaded", function () {

    const expenseNameInput = document.getElementById("expenseName");
    const expenseAmountInput = document.getElementById("expenseAmount");
    const addExpenseBtn = document.getElementById("addExpenseBtn");
    const expenseList = document.getElementById("expenseList");
    const totalAmountDisplay = document.getElementById("totalAmount");

    // Load expenses from localStorage
    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

    function saveToLocalStorage() {
        localStorage.setItem("expenses", JSON.stringify(expenses));
    }

    function updateTotal() {
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        totalAmountDisplay.textContent = total;
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

    addExpenseBtn.addEventListener("click", function () {

        const name = expenseNameInput.value.trim();
        const amount = parseFloat(expenseAmountInput.value);

        if (name === "" || isNaN(amount)) {
            alert("Enter valid details");
            return;
        }

        expenses.push({ name, amount });

        saveToLocalStorage();
        renderExpenses();
        updateTotal();

        expenseNameInput.value = "";
        expenseAmountInput.value = "";
    });

    expenseList.addEventListener("click", function (e) {
        if (e.target.classList.contains("delete-btn")) {
            const index = e.target.getAttribute("data-index");

            expenses.splice(index, 1);

            saveToLocalStorage();
            renderExpenses();
            updateTotal();
        }
    });

    // Initial render on page load
    renderExpenses();
    updateTotal();

});
