function renderTransactions() {
    const list = document.getElementById("transaction-list");
    if (!list) return;

    list.innerHTML = "";

    const transactions = getTransactions();

    transactions.forEach(txn => {
        const li = document.createElement("li");
        li.className = "transaction-item";

        const main = document.createElement("div");
        main.className = "transaction-main";

        const description = document.createElement("div");
        description.className = "transaction-description";
        description.textContent = txn.description;

        const meta = document.createElement("div");
        meta.className = "transaction-meta";
        meta.textContent = `Sample transaction · ID ${txn.id}`;

        main.appendChild(description);
        main.appendChild(meta);

        const amount = document.createElement("div");
        amount.className = "transaction-amount " + (txn.amount >= 0 ? "positive" : "negative");
        amount.textContent = `₹${txn.amount.toLocaleString("en-IN")}`;

        li.appendChild(main);
        li.appendChild(amount);

        list.appendChild(li);
    });
}

function renderSummary() {
    const transactions = getTransactions();
    const total = calculateTotal(transactions);

    const income = transactions
        .filter(txn => txn.amount > 0)
        .reduce((sum, txn) => sum + txn.amount, 0);

    const expenses = transactions
        .filter(txn => txn.amount < 0)
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

    const balanceEl = document.getElementById("summary-balance");
    const incomeEl = document.getElementById("summary-income");
    const expensesEl = document.getElementById("summary-expenses");

    if (balanceEl) {
        balanceEl.textContent = `₹${total.toLocaleString("en-IN")}`;
    }

    if (incomeEl) {
        incomeEl.textContent = `₹${income.toLocaleString("en-IN")}`;
    }

    if (expensesEl) {
        expensesEl.textContent = `₹${expenses.toLocaleString("en-IN")}`;
    }

    // Maintain backward compatibility with the legacy summary div if it exists
    const legacySummary = document.getElementById("summary");
    if (legacySummary) {
        legacySummary.innerHTML = `<h3>Total Balance: ₹${total.toLocaleString("en-IN")}</h3>`;
    }
}

function renderAll() {
    renderSummary();
    renderTransactions();
}

async function loadTransactions() {
    try {
        const res = await fetch("http://localhost:5000/api/transactions");
        if (!res.ok) {
            throw new Error("Failed to fetch transactions from backend");
        }
        const data = await res.json();

        // For Phase 1 we only log; future phases will hydrate the UI from API
        console.log("Backend transactions (not yet wired to UI):", data);
    } catch (err) {
        console.warn("Backend not available yet, using sample data only.", err.message);
    }
}

// Kick off sample data rendering and attempt backend fetch
renderAll();
loadTransactions();