const API_URL = "http://localhost:5000/api/transactions";

// State management for frontend-only deletions
let deletedIds = new Set();
let allTransactions = [];

async function fetchTransactions() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        // Save to state
        allTransactions = data;

        updateUI();
    } catch (error) {
        console.error("Error fetching transactions:", error);
        showToast("Error connecting to server. Is the backend running?", "error");
    }
}

function updateUI() {
    // Filter out locally deleted transactions
    const validTransactions = allTransactions.filter(t => !deletedIds.has(t.id));

    // Sort by id descending (newest first assuming id is timestamp)
    validTransactions.sort((a, b) => b.id - a.id);

    renderTransactions(validTransactions);
    renderSummary(validTransactions);

    // Update badge count
    document.getElementById("transaction-count").textContent =
        `${validTransactions.length} Record${validTransactions.length !== 1 ? 's' : ''}`;
}

async function addTransaction(transaction) {
    const btn = document.getElementById("submit-btn");
    const btnText = btn.querySelector(".btn-text");
    const spinner = btn.querySelector(".spinner");

    // Set loading state
    btn.disabled = true;
    btnText.textContent = "Adding...";
    spinner.classList.remove("hidden");

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transaction),
        });

        if (!res.ok) throw new Error("Failed to add");

        const newTx = await res.json();
        allTransactions.push(newTx);
        updateUI();
        showToast("Transaction added successfully!");

        // Reset form and focus amount
        document.getElementById("transaction-form").reset();
        document.getElementById("amount").focus();

    } catch (error) {
        console.error("Error adding transaction:", error);
        showToast("Failed to add transaction.", "error");
    } finally {
        // Remove loading state
        btn.disabled = false;
        btnText.textContent = "Add Transaction";
        spinner.classList.add("hidden");
    }
}

window.handleDelete = function (id) {
    // Show confirmation before deleting
    if (confirm("Are you sure you want to delete this transaction?")) {
        // Add to frontend-only deleted list
        deletedIds.add(id);
        updateUI();
        showToast("Transaction deleted.");
    }
};

function renderTransactions(transactions) {
    const list = document.getElementById("transaction-list");
    const emptyState = document.getElementById("empty-state");

    list.innerHTML = "";

    if (transactions.length === 0) {
        emptyState.classList.remove("hidden");
        list.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    list.classList.remove("hidden");

    transactions.forEach((t) => {
        const li = document.createElement("li");
        li.className = "transaction-item";

        const isIncome = t.type === "income";
        const iconClass = isIncome ? "t-income" : "t-expense";
        const iconChar = isIncome ? "↓" : "↑";
        const amountClass = isIncome ? "text-green" : "text-red";

        // Parse float gracefully
        const amt = parseFloat(t.amount) || 0;
        const formattedAmount = `₹${amt.toLocaleString('en-IN')}`;

        li.innerHTML = `
            <div class="t-info">
                <div class="t-icon ${iconClass}">
                    ${iconChar}
                </div>
                <div class="t-details">
                    <h4>${t.category}</h4>
                    <p>${t.description}</p>
                </div>
            </div>
            <div class="t-meta">
                <span class="t-amount ${amountClass}">
                    ${isIncome ? '+' : '-'}${formattedAmount}
                </span>
                <button class="delete-btn" onclick="handleDelete(${t.id})" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;
        list.appendChild(li);
    });
}

function renderSummary(transactions) {
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expense = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const balance = income - expense;

    // Use Intl.NumberFormat for nice Indian Rupee formatting
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    document.getElementById("balance").textContent = formatter.format(balance).replace('₹', '₹'); // Fallback if symbol differs
    document.getElementById("income").textContent = formatter.format(income);
    document.getElementById("expense").textContent = formatter.format(expense);
}

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");

    // Icon for success/error
    const icon = type === "success"
        ? `<svg class="toast-success-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    toast.classList.add("show");

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function initApp() {
    // 1. Fetch initial transactions
    fetchTransactions();

    // 2. Attach submit event listener to the form
    const form = document.getElementById("transaction-form");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            console.log("Form submit triggered!");

            const transaction = {
                amount: document.getElementById("amount").value,
                type: document.getElementById("type").value,
                category: document.getElementById("category").value,
                description: document.getElementById("description").value,
            };

            // Call the async add function
            addTransaction(transaction);
        });
    } else {
        console.error("Form element 'transaction-form' not found on page load.");
    }
}

// Initialize immediately since script is deferred or at the bottom of the body
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}