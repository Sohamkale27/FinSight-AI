const API_BASE_URL = "http://localhost:5000/api";
const AUTH_TOKEN_KEY = "finsight.authToken";

let transactions = [];
let currentUser = null;
let authToken = localStorage.getItem(AUTH_TOKEN_KEY) || "";
let toastTimer;
let authMode = "login";
let authShell;
let dashboardShell;
let analyticsSummary = null;
let analyticsCharts = null;
let analyticsInsights = [];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const chartPalette = ["#4f8cff", "#10b981", "#ef4444", "#8b5cf6", "#22d3ee", "#f59e0b"];

function updateTransactionCount(count) {
    const counter = document.getElementById("transaction-count");
    if (counter) {
        counter.textContent = `${count} Record${count !== 1 ? "s" : ""}`;
    }
}

function setSubmitLoading(isLoading) {
    const btn = document.getElementById("submit-btn");
    if (!btn) {
        return;
    }

    const btnText = btn.querySelector(".btn-text");
    const spinner = btn.querySelector(".spinner");

    btn.disabled = isLoading;
    btn.setAttribute("aria-busy", String(isLoading));

    if (btnText) {
        btnText.textContent = isLoading ? "Adding..." : "Add Transaction";
    }

    if (spinner) {
        spinner.classList.toggle("hidden", !isLoading);
    }
}

function setListLoading(isLoading) {
    const list = document.getElementById("transaction-list");
    const emptyState = document.getElementById("empty-state");

    if (!list || !emptyState) {
        return;
    }

    if (isLoading) {
        list.classList.add("hidden");
        emptyState.classList.remove("hidden");
        emptyState.innerHTML = `
            <div class="empty-state-icon">
                <span class="spinner" aria-hidden="true"></span>
            </div>
            <p>Loading transactions</p>
            <span class="empty-subtext">Syncing your live ledger from the backend.</span>
        `;
        return;
    }

    emptyState.innerHTML = `
        <div class="empty-state-icon">
            <svg class="empty-icon" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3v18"></path>
                <path d="M3 12h18"></path>
                <circle cx="12" cy="12" r="9"></circle>
            </svg>
        </div>
        <p>No transactions yet</p>
        <span class="empty-subtext">Your ledger will appear here as soon as you add the first entry.</span>
    `;
}

async function parseJsonResponse(response, fallbackMessage) {
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
        const message = data && data.error ? data.error : fallbackMessage;
        throw new Error(message);
    }

    return data;
}

function persistSession(token, user) {
    authToken = token;
    currentUser = user;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearSession() {
    authToken = "";
    currentUser = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

function ensureDashboardShell() {
    dashboardShell = document.getElementById("dashboard-shell") || document.querySelector(".app-shell");

    if (dashboardShell && !dashboardShell.id) {
        dashboardShell.id = "dashboard-shell";
    }

    return dashboardShell;
}

function ensureAuthShell() {
    if (authShell) {
        return authShell;
    }

    const root = ensureDashboardShell();

    authShell = document.createElement("section");
    authShell.id = "auth-shell";
    authShell.className = "app-shell hidden";
    authShell.innerHTML = `
        <header class="hero-section glass-panel">
            <div class="hero-copy">
                <div class="eyebrow">
                    <span class="eyebrow-dot"></span>
                    Secure account access
                </div>
                <h1>FinSight AI</h1>
                <p class="hero-text">Sign in to keep your transactions private. Every record is tied to your account and protected with JWT authentication.</p>
                <div class="hero-meta">
                    <div class="hero-chip">
                        <span class="chip-label">Authentication</span>
                        <span class="chip-value">JWT session</span>
                    </div>
                    <div class="hero-chip">
                        <span class="chip-label">Privacy</span>
                        <span class="chip-value">User-specific data</span>
                    </div>
                </div>
            </div>

            <div class="hero-spotlight glass-panel">
                <span class="spotlight-label">Welcome back</span>
                <strong>Sign in to continue</strong>
                <p>Use the same account on every device and your session will persist in this browser until you log out.</p>
            </div>
        </header>

        <main class="dashboard-grid">
            <section class="card form-card glass-panel">
                <div class="card-header">
                    <div>
                        <span class="section-kicker" id="auth-kicker">Account access</span>
                        <h2 id="auth-title">Login</h2>
                    </div>
                    <p class="subtitle" id="auth-subtitle">Sign in to load your own transactions.</p>
                </div>

                <form id="auth-form">
                    <div class="form-grid">
                        <div id="auth-name-group" class="field-group span-2 hidden">
                            <label for="auth-name">Name</label>
                            <div class="input-shell">
                                <input type="text" id="auth-name" placeholder="Your name" autocomplete="name" />
                            </div>
                        </div>

                        <div class="field-group span-2">
                            <label for="auth-email">Email</label>
                            <div class="input-shell">
                                <input type="email" id="auth-email" placeholder="you@example.com" autocomplete="email" required />
                            </div>
                        </div>

                        <div class="field-group span-2">
                            <label for="auth-password">Password</label>
                            <div class="input-shell">
                                <input type="password" id="auth-password" placeholder="Minimum 8 characters" autocomplete="current-password" required minlength="8" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" id="auth-submit-btn" class="primary-btn">
                        <span class="btn-glow"></span>
                        <span class="btn-text" id="auth-submit-text">Login</span>
                        <span class="spinner hidden" aria-hidden="true"></span>
                    </button>

                    <button type="button" id="auth-toggle-btn" style="margin-top: 1rem; background: none; border: none; color: inherit; padding: 0; font: inherit; cursor: pointer; text-decoration: underline; opacity: 0.9;">
                        Need an account? Sign up
                    </button>
                </form>
            </section>
        </main>
    `;

    root.parentNode.insertBefore(authShell, root);
    wireAuthUI();
    return authShell;
}

function updateDashboardAuthChip() {
    const heroMeta = document.querySelector("#dashboard-shell .hero-meta");

    if (!heroMeta) {
        return;
    }

    let sessionChip = document.getElementById("session-chip");

    if (!sessionChip) {
        sessionChip = document.createElement("div");
        sessionChip.className = "hero-chip";
        sessionChip.id = "session-chip";
        sessionChip.innerHTML = `
            <span class="chip-label">Session</span>
            <button type="button" id="logout-btn" class="chip-value" style="background: none; border: none; padding: 0; color: inherit; font: inherit; cursor: pointer;">
                Logout
            </button>
        `;
        heroMeta.appendChild(sessionChip);

        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", logout);
        }
    }
}

function setShellVisibility(isAuthenticated) {
    if (authShell) {
        authShell.classList.toggle("hidden", isAuthenticated);
    }

    if (dashboardShell) {
        dashboardShell.classList.toggle("hidden", !isAuthenticated);
    }
}

function clearAnalyticsState() {
    analyticsSummary = null;
    analyticsCharts = null;
    analyticsInsights = [];
}

function setAuthMode(nextMode) {
    authMode = nextMode === "signup" ? "signup" : "login";

    const nameGroup = document.getElementById("auth-name-group");
    const nameInput = document.getElementById("auth-name");
    const title = document.getElementById("auth-title");
    const subtitle = document.getElementById("auth-subtitle");
    const submitText = document.getElementById("auth-submit-text");
    const toggleBtn = document.getElementById("auth-toggle-btn");
    const passwordInput = document.getElementById("auth-password");

    if (authMode === "signup") {
        if (nameGroup) {
            nameGroup.classList.remove("hidden");
        }

        if (nameInput) {
            nameInput.required = true;
        }

        if (title) {
            title.textContent = "Sign Up";
        }

        if (subtitle) {
            subtitle.textContent = "Create your account to start saving private transactions.";
        }

        if (submitText) {
            submitText.textContent = "Create Account";
        }

        if (toggleBtn) {
            toggleBtn.textContent = "Already have an account? Log in";
        }

        if (passwordInput) {
            passwordInput.setAttribute("autocomplete", "new-password");
        }
    } else {
        if (nameGroup) {
            nameGroup.classList.add("hidden");
        }

        if (nameInput) {
            nameInput.required = false;
            nameInput.value = "";
        }

        if (title) {
            title.textContent = "Login";
        }

        if (subtitle) {
            subtitle.textContent = "Sign in to load your own transactions.";
        }

        if (submitText) {
            submitText.textContent = "Login";
        }

        if (toggleBtn) {
            toggleBtn.textContent = "Need an account? Sign up";
        }

        if (passwordInput) {
            passwordInput.setAttribute("autocomplete", "current-password");
        }
    }
}

function wireAuthUI() {
    const authForm = document.getElementById("auth-form");
    const authToggleBtn = document.getElementById("auth-toggle-btn");

    if (authForm) {
        authForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const email = document.getElementById("auth-email")?.value.trim();
            const password = document.getElementById("auth-password")?.value;
            const name = document.getElementById("auth-name")?.value.trim();

            const payload = {
                email,
                password,
            };

            if (authMode === "signup") {
                payload.name = name;
            }

            await submitAuthForm(payload);
        });
    }

    if (authToggleBtn) {
        authToggleBtn.addEventListener("click", () => {
            setAuthMode(authMode === "login" ? "signup" : "login");
        });
    }

    setAuthMode(authMode);
}

async function apiFetch(path, options = {}, skipAuth = false) {
    const headers = new Headers(options.headers || {});

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (!skipAuth && authToken) {
        headers.set("Authorization", `Bearer ${authToken}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && !skipAuth) {
        await handleSessionExpired({ silent: true });
        throw new Error("Your session expired. Please log in again.");
    }

    return response;
}

async function handleSessionExpired({ silent = false } = {}) {
    clearSession();
    transactions = [];
    clearAnalyticsState();
    renderDashboard();
    setShellVisibility(false);

    if (!silent) {
        showToast("Your session expired. Please log in again.", "error");
    }
}

async function hydrateSession() {
    if (!authToken) {
        setShellVisibility(false);
        return;
    }

    try {
        const response = await apiFetch("/auth/me");
        const data = await parseJsonResponse(response, "Failed to verify session.");
        currentUser = data.user;
        updateDashboardAuthChip();
        setShellVisibility(true);
        await fetchTransactions();
    } catch (error) {
        console.error("[frontend] hydrateSession failed:", error);
        if (authToken) {
            await handleSessionExpired();
        }
    }
}

async function fetchTransactions() {
    if (!authToken) {
        return;
    }

    setListLoading(true);

    try {
        console.log("[frontend] fetching transactions");
        const response = await apiFetch("/transactions");
        const data = await parseJsonResponse(response, "Failed to fetch transactions.");

        transactions = Array.isArray(data) ? data : [];
        renderDashboard();
        await loadAnalytics();
    } catch (error) {
        console.error("[frontend] fetchTransactions failed:", error);
        showToast(error.message || "Error connecting to server. Is the backend running?", "error");
    } finally {
        setListLoading(false);
    }
}

async function submitAuthForm(payload) {
    const submitButton = document.getElementById("auth-submit-btn");
    const submitText = document.getElementById("auth-submit-text");
    const spinner = submitButton ? submitButton.querySelector(".spinner") : null;

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");
    }

    if (submitText) {
        submitText.textContent = authMode === "signup" ? "Creating..." : "Logging in...";
    }

    if (spinner) {
        spinner.classList.remove("hidden");
    }

    try {
        const endpoint = authMode === "signup" ? "/auth/signup" : "/auth/login";
        const response = await apiFetch(endpoint, {
            method: "POST",
            body: JSON.stringify(payload),
        }, true);

        const data = await parseJsonResponse(response, authMode === "signup" ? "Failed to create account." : "Failed to sign in.");

        persistSession(data.token, data.user);
        updateDashboardAuthChip();
        setShellVisibility(true);
        renderDashboard();
        showToast(authMode === "signup" ? "Account created successfully." : "Welcome back!");
        document.getElementById("transaction-form")?.reset();
        await fetchTransactions();
    } catch (error) {
        console.error("[frontend] submitAuthForm failed:", error);
        showToast(error.message || "Authentication failed.", "error");
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.setAttribute("aria-busy", "false");
        }

        if (submitText) {
            submitText.textContent = authMode === "signup" ? "Create Account" : "Login";
        }

        if (spinner) {
            spinner.classList.add("hidden");
        }
    }
}

async function addTransaction(transaction) {
    setSubmitLoading(true);

    try {
        console.log("[frontend] creating transaction", transaction);
        const response = await apiFetch("/transactions", {
            method: "POST",
            body: JSON.stringify(transaction),
        });

        const newTransaction = await parseJsonResponse(response, "Failed to add transaction.");
        transactions = [newTransaction, ...transactions];
        renderDashboard();
        await loadAnalytics();
        showToast("Transaction added successfully!");

        document.getElementById("transaction-form").reset();
        document.getElementById("amount").focus();
    } catch (error) {
        console.error("[frontend] addTransaction failed:", error);
        showToast(error.message || "Failed to add transaction.", "error");
    } finally {
        setSubmitLoading(false);
    }
}

async function deleteTransaction(id, buttonElement) {
    if (!confirm("Are you sure you want to delete this transaction?")) {
        return;
    }

    const originalMarkup = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = `<span class="spinner" aria-hidden="true"></span>`;

    try {
        console.log(`[frontend] deleting transaction id=${id}`);
        const response = await apiFetch(`/transactions/${id}`, { method: "DELETE" });

        if (!response.ok) {
            const contentType = response.headers.get("content-type") || "";
            const data = contentType.includes("application/json") ? await response.json() : null;
            throw new Error(data && data.error ? data.error : "Failed to delete transaction.");
        }

        transactions = transactions.filter((transaction) => transaction.id !== id);
        renderDashboard();
        await loadAnalytics();
        showToast("Transaction deleted.");
    } catch (error) {
        console.error("[frontend] deleteTransaction failed:", error);
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalMarkup;
        showToast(error.message || "Failed to delete transaction.", "error");
    }
}

async function logout() {
    try {
        if (authToken) {
            await apiFetch("/auth/logout", { method: "POST" });
        }
    } catch (error) {
        console.warn("[frontend] logout request failed:", error);
    } finally {
        clearSession();
        transactions = [];
        clearAnalyticsState();
        renderDashboard();
        setShellVisibility(false);
        showToast("You have been signed out.");
    }
}

window.handleDelete = function (id, buttonElement) {
    deleteTransaction(id, buttonElement);
};

function getTransactionIcon(isIncome) {
    return isIncome
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"></path><path d="M19 12l-7 7-7-7"></path></svg>`;
}

function renderTransactions(transactionItems) {
    const list = document.getElementById("transaction-list");
    const emptyState = document.getElementById("empty-state");

    if (!list || !emptyState) {
        return;
    }

    list.innerHTML = "";

    if (transactionItems.length === 0) {
        emptyState.classList.remove("hidden");
        list.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    list.classList.remove("hidden");

    transactionItems.forEach((transaction) => {
        const li = document.createElement("li");
        li.className = "transaction-item";

        const isIncome = transaction.type === "income";
        const iconClass = isIncome ? "t-income" : "t-expense";
        const amountClass = isIncome ? "text-green" : "text-red";
        const amount = Number(transaction.amount) || 0;

        li.innerHTML = `
            <div class="t-info">
                <div class="t-icon ${iconClass}">
                    ${getTransactionIcon(isIncome)}
                </div>
                <div class="t-details">
                    <h4>${escapeHtml(transaction.category)}</h4>
                    <p>${escapeHtml(transaction.description)}</p>
                </div>
            </div>
            <div class="t-meta">
                <span class="t-amount ${amountClass}">
                    ${isIncome ? "+" : "-"}${currencyFormatter.format(amount)}
                </span>
                <button class="delete-btn" onclick="handleDelete(${transaction.id}, this)" title="Delete transaction" aria-label="Delete transaction">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;

        list.appendChild(li);
    });
}

function renderSummary(transactionItems) {
    const income = transactionItems
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const expense = transactionItems
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const balance = income - expense;

    const balanceEl = document.getElementById("balance");
    const incomeEl = document.getElementById("income");
    const expenseEl = document.getElementById("expense");

    if (balanceEl) {
        balanceEl.textContent = currencyFormatter.format(balance);
    }

    if (incomeEl) {
        incomeEl.textContent = currencyFormatter.format(income);
    }

    if (expenseEl) {
        expenseEl.textContent = currencyFormatter.format(expense);
    }
}

function deriveLocalAnalyticsSummary(transactionItems) {
    const now = new Date();
    const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const currentMonthTotals = transactionItems.reduce((accumulator, transaction) => {
        const date = new Date(transaction.createdAt);
        const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

        if (monthKey === currentMonthKey) {
            const amount = Number(transaction.amount) || 0;
            if (transaction.type === "income") {
                accumulator.income += amount;
            } else {
                accumulator.expense += amount;
            }
        }

        return accumulator;
    }, { income: 0, expense: 0 });

    const totalIncome = transactionItems
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const totalExpenses = transactionItems
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
        monthlyCashFlow: currentMonthTotals.income - currentMonthTotals.expense,
        currentMonthLabel: "Current month",
        previousMonthLabel: "Previous month",
    };
}

function getActiveAnalyticsSummary() {
    return analyticsSummary || deriveLocalAnalyticsSummary(transactions);
}

function setMetricValue(id, value) {
    const node = document.getElementById(id);
    if (node) {
        node.textContent = value;
    }
}

function renderAnalyticsMetrics() {
    const summary = getActiveAnalyticsSummary();
    const netBalanceIsPositive = summary.netBalance >= 0;

    setMetricValue("analytics-total-income", currencyFormatter.format(summary.totalIncome));
    setMetricValue("analytics-total-expenses", currencyFormatter.format(summary.totalExpenses));
    setMetricValue("analytics-net-balance", currencyFormatter.format(summary.netBalance));
    setMetricValue("analytics-savings-rate", `${Math.round(summary.savingsRate || 0)}%`);
    setMetricValue("analytics-monthly-cash-flow", currencyFormatter.format(summary.monthlyCashFlow));

    setMetricValue(
        "analytics-total-income-note",
        summary.totalIncome > 0 ? "All credited transactions" : "Add income to activate insights",
    );
    setMetricValue(
        "analytics-total-expenses-note",
        summary.totalExpenses > 0 ? "All outgoing transactions" : "Add expenses to reveal category pressure",
    );
    setMetricValue(
        "analytics-net-balance-note",
        netBalanceIsPositive ? "Positive cash position" : "Expenses are ahead of income",
    );
    setMetricValue(
        "analytics-savings-rate-note",
        summary.totalIncome > 0 ? "Balance relative to income" : "Savings rate needs income first",
    );
    setMetricValue(
        "analytics-monthly-cash-flow-note",
        summary.monthlyCashFlow >= 0 ? "Current month generated surplus" : "Current month is running a deficit",
    );
}

function renderLegend(container, items) {
    if (!container) {
        return;
    }

    if (!items.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = items.map((item) => `
        <span class="chart-legend-item">
            <span class="chart-legend-swatch" style="background:${item.color};"></span>
            <span>${escapeHtml(item.label)}: ${escapeHtml(item.valueLabel)}</span>
        </span>
    `).join("");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function createEmptyChartMarkup(title, description) {
    return `
        <div class="empty-state" style="min-height: 240px; padding: 28px 16px;">
            <div class="empty-state-icon" style="width: 88px; height: 88px;">
                <svg class="empty-icon" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 3v18"></path>
                    <path d="M3 12h18"></path>
                </svg>
            </div>
            <p>${escapeHtml(title)}</p>
            <span class="empty-subtext">${escapeHtml(description)}</span>
        </div>
    `;
}

function createPieChartMarkup(items) {
    const total = items.reduce((sum, item) => sum + item.value, 0);

    if (!items.length || total <= 0) {
        return createEmptyChartMarkup("No expense data yet", "Add expenses to unlock the category breakdown.");
    }

    const cx = 122;
    const cy = 126;
    const radius = 84;
    const circumference = 2 * Math.PI * radius;
    let progress = 0;

    const slices = items.map((item) => {
        const sliceLength = (item.value / total) * circumference;
        const dashOffset = circumference * 0.25 - progress;
        progress += sliceLength;

        return `
            <circle
                cx="${cx}"
                cy="${cy}"
                r="${radius}"
                fill="none"
                stroke="${item.color}"
                stroke-width="24"
                stroke-linecap="round"
                stroke-dasharray="${sliceLength} ${circumference - sliceLength}"
                stroke-dashoffset="${dashOffset}"
                transform="rotate(-90 ${cx} ${cy})"
            >
                <title>${escapeHtml(item.label)}: ${escapeHtml(item.valueLabel)} (${Math.round(item.share)}%)</title>
            </circle>
        `;
    }).join("");

    return `
        <svg viewBox="0 0 320 260" role="img" aria-label="Expense by category donut chart">
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="24"></circle>
            <g>${slices}</g>
            <text x="${cx}" y="${cy - 8}" text-anchor="middle" fill="currentColor" font-size="30" font-weight="800">${currencyFormatter.format(total)}</text>
            <text x="${cx}" y="${cy + 18}" text-anchor="middle" fill="currentColor" font-size="12" fill-opacity="0.72">Total expenses</text>
        </svg>
    `;
}

function createGroupedBarChartMarkup(chartData) {
    const series = chartData?.series || [];
    const labels = chartData?.labels || [];
    const values = series.flatMap((item) => item.values || []);

    if (!series.length || !labels.length || values.every((value) => Number(value) <= 0)) {
        return createEmptyChartMarkup("No comparison data yet", "Add income and expense entries to populate the monthly bars.");
    }

    const maxValue = Math.max(1, ...values);
    const width = 420;
    const height = 260;
    const left = 34;
    const right = 18;
    const top = 18;
    const bottom = 42;
    const chartHeight = height - top - bottom;
    const chartWidth = width - left - right;
    const groupWidth = labels.length > 0 ? chartWidth / labels.length : chartWidth;
    const barGap = 7;
    const barWidth = Math.min(22, (groupWidth - barGap * 3) / Math.max(1, series.length));
    const gridLines = [0.25, 0.5, 0.75, 1];

    const bars = labels.map((label, index) => {
        const groupCenter = left + (index * groupWidth) + (groupWidth / 2);
        const totalWidth = (series.length * barWidth) + ((series.length - 1) * barGap);
        const startX = groupCenter - (totalWidth / 2);

        return series.map((entry, entryIndex) => {
            const value = Number(entry.values[index]) || 0;
            const barHeight = (value / maxValue) * chartHeight;
            const x = startX + (entryIndex * (barWidth + barGap));
            const y = top + (chartHeight - barHeight);

            return `
                <rect
                    x="${x.toFixed(2)}"
                    y="${y.toFixed(2)}"
                    width="${barWidth}"
                    height="${Math.max(1, barHeight).toFixed(2)}"
                    rx="8"
                    fill="${entry.color}"
                    fill-opacity="${entryIndex === 0 ? 0.92 : 0.88}"
                >
                    <title>${escapeHtml(entry.label)} ${escapeHtml(label)}: ${escapeHtml(currencyFormatter.format(value))}</title>
                </rect>
            `;
        }).join("");
    }).join("");

    const axes = gridLines.map((line) => {
        const y = top + (chartHeight * line);
        return `
            <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4 6"></line>
            <text x="${left - 8}" y="${y + 4}" text-anchor="end" fill="currentColor" font-size="10" fill-opacity="0.55">${escapeHtml(currencyFormatter.format(Math.round(maxValue * (1 - line))))}</text>
        `;
    }).join("");

    const xLabels = labels.map((label, index) => {
        const x = left + (index * groupWidth) + (groupWidth / 2);
        return `<text x="${x}" y="${height - 12}" text-anchor="middle" fill="currentColor" font-size="11" fill-opacity="0.7">${escapeHtml(label)}</text>`;
    }).join("");

    return `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Income and expense bar chart">
            ${axes}
            <line x1="${left}" y1="${top + chartHeight}" x2="${width - right}" y2="${top + chartHeight}" stroke="rgba(255,255,255,0.18)"></line>
            ${bars}
            ${xLabels}
        </svg>
    `;
}

function createLineChartMarkup(chartData) {
    const labels = chartData?.labels || [];
    const values = chartData?.values || [];
    const maxValue = Math.max(1, ...values);
    const width = 420;
    const height = 260;
    const left = 40;
    const right = 20;
    const top = 18;
    const bottom = 42;
    const chartHeight = height - top - bottom;
    const chartWidth = width - left - right;
    const points = labels.map((label, index) => {
        const x = labels.length === 1 ? left + chartWidth / 2 : left + (chartWidth * (index / (labels.length - 1)));
        const value = Number(values[index]) || 0;
        const y = top + (chartHeight - ((value / maxValue) * chartHeight));
        return { x, y, value, label };
    });

    if (!points.length || values.every((value) => Number(value) <= 0)) {
        return createEmptyChartMarkup("No trend data yet", "Add expenses across a few months to reveal the spending line.");
    }

    const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${top + chartHeight} L ${points[0].x.toFixed(2)} ${top + chartHeight} Z`;

    const gridLines = [0.25, 0.5, 0.75, 1];
    const axes = gridLines.map((line) => {
        const y = top + (chartHeight * line);
        return `
            <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4 6"></line>
            <text x="${left - 8}" y="${y + 4}" text-anchor="end" fill="currentColor" font-size="10" fill-opacity="0.55">${escapeHtml(currencyFormatter.format(Math.round(maxValue * (1 - line))))}</text>
        `;
    }).join("");

    const xLabels = points.map((point) => `<text x="${point.x}" y="${height - 12}" text-anchor="middle" fill="currentColor" font-size="11" fill-opacity="0.7">${escapeHtml(point.label)}</text>`).join("");
    const dots = points.map((point) => `
        <circle cx="${point.x}" cy="${point.y}" r="5.5" fill="#22d3ee" stroke="rgba(255,255,255,0.8)" stroke-width="2">
            <title>${escapeHtml(point.label)}: ${escapeHtml(currencyFormatter.format(point.value))}</title>
        </circle>
    `).join("");

    return `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly spending trend line chart">
            ${axes}
            <path d="${areaPath}" fill="rgba(34, 211, 238, 0.14)" stroke="none"></path>
            <path d="${linePath}" fill="none" stroke="#22d3ee" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></path>
            ${dots}
            ${xLabels}
        </svg>
    `;
}

function renderChartContainer(containerId, legendId, markup, legendItems = []) {
    const container = document.getElementById(containerId);
    const legend = document.getElementById(legendId);

    if (container) {
        container.innerHTML = markup;
    }

    renderLegend(legend, legendItems);
}

function renderAnalyticsCharts() {
    if (!analyticsCharts) {
        renderChartContainer(
            "expense-category-chart",
            "expense-category-legend",
            createEmptyChartMarkup("Loading analytics", "Your chart data will appear once the endpoints respond."),
        );
        renderChartContainer(
            "income-expense-chart",
            "income-expense-legend",
            createEmptyChartMarkup("Loading analytics", "Your chart data will appear once the endpoints respond."),
        );
        renderChartContainer(
            "monthly-spending-chart",
            "monthly-spending-legend",
            createEmptyChartMarkup("Loading analytics", "Your chart data will appear once the endpoints respond."),
        );
        return;
    }

    const expenseCategories = analyticsCharts.expenseByCategory || [];
    const incomeVsExpense = analyticsCharts.incomeVsExpense || { labels: [], series: [] };
    const monthlyTrend = analyticsCharts.monthlySpendingTrend || { labels: [], values: [] };

    renderChartContainer(
        "expense-category-chart",
        "expense-category-legend",
        createPieChartMarkup(
            expenseCategories.map((item) => ({
                ...item,
                valueLabel: currencyFormatter.format(item.value || 0),
            })),
        ),
        expenseCategories.map((item) => ({
            label: item.label,
            valueLabel: currencyFormatter.format(item.value || 0),
            color: item.color,
        })),
    );

    renderChartContainer(
        "income-expense-chart",
        "income-expense-legend",
        createGroupedBarChartMarkup(incomeVsExpense),
        (incomeVsExpense.series || []).map((entry) => ({
            label: entry.label,
            valueLabel: currencyFormatter.format(entry.values.reduce((sum, value) => sum + (Number(value) || 0), 0)),
            color: entry.color,
        })),
    );

    renderChartContainer(
        "monthly-spending-chart",
        "monthly-spending-legend",
        createLineChartMarkup(monthlyTrend),
        [
            {
                label: "Spending trend",
                valueLabel: monthlyTrend.values?.length ? currencyFormatter.format(monthlyTrend.values[monthlyTrend.values.length - 1] || 0) : currencyFormatter.format(0),
                color: "#22d3ee",
            },
        ],
    );
}

function renderAnalyticsInsights() {
    const insightsList = document.getElementById("analytics-insights");
    if (!insightsList) {
        return;
    }

    const items = Array.isArray(analyticsInsights) ? analyticsInsights : [];

    if (!items.length) {
        insightsList.innerHTML = `
            <li class="insight-item">
                <span class="insight-index">i</span>
                <span class="insight-copy">Add more transactions to generate spending patterns, recommendations, and budget warnings.</span>
            </li>
        `;
        return;
    }

    insightsList.innerHTML = items.map((insight, index) => `
        <li class="insight-item">
            <span class="insight-index">${index + 1}</span>
            <span class="insight-copy">${escapeHtml(insight)}</span>
        </li>
    `).join("");
}

function renderDashboard() {
    renderTransactions(transactions);
    renderSummary(transactions);
    renderAnalyticsMetrics();
    renderAnalyticsCharts();
    renderAnalyticsInsights();
    updateTransactionCount(transactions.length);
}

async function loadAnalytics() {
    if (!authToken) {
        clearAnalyticsState();
        renderDashboard();
        return;
    }

    try {
        const [summaryResponse, chartsResponse, insightsResponse] = await Promise.all([
            apiFetch("/analytics/summary"),
            apiFetch("/analytics/charts"),
            apiFetch("/analytics/insights"),
        ]);

        const [summaryData, chartsData, insightsData] = await Promise.all([
            parseJsonResponse(summaryResponse, "Failed to load analytics summary."),
            parseJsonResponse(chartsResponse, "Failed to load analytics charts."),
            parseJsonResponse(insightsResponse, "Failed to load analytics insights."),
        ]);

        analyticsSummary = summaryData || null;
        analyticsCharts = chartsData || null;
        analyticsInsights = Array.isArray(insightsData?.insights) ? insightsData.insights : [];
        renderDashboard();
    } catch (error) {
        console.warn("[frontend] loadAnalytics failed:", error);
        analyticsSummary = null;
        analyticsCharts = {
            expenseByCategory: [],
            incomeVsExpense: { labels: [], series: [] },
            monthlySpendingTrend: { labels: [], values: [] },
        };
        analyticsInsights = [];
        renderDashboard();
    }
}

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");

    if (!toast) {
        return;
    }

    const icon = type === "success"
        ? `<svg class="toast-success-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.classList.remove("hidden", "toast-success", "toast-error");
    toast.classList.add(type === "success" ? "toast-success" : "toast-error");
    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function wireTransactionForm() {
    const form = document.getElementById("transaction-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const transaction = {
            amount: document.getElementById("amount").value,
            type: document.getElementById("type").value,
            category: document.getElementById("category").value,
            description: document.getElementById("description").value,
        };

        addTransaction(transaction);
    });
}

async function initApp() {
    ensureDashboardShell();
    ensureAuthShell();
    wireTransactionForm();
    renderDashboard();

    if (authToken) {
        await hydrateSession();
    } else {
        setShellVisibility(false);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
