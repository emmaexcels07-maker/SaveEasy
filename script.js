/*
=====================================================
SAVE EASY DATABASE
=====================================================
*/

const DEFAULT_USERS = [
    {
        id: 1,
        name: "Administrator",
        username: "admin",
        password: "1234",
        role: "admin"
    },
    {
        id: 2,
        name: "John Agent",
        username: "agent1",
        password: "1234",
        role: "agent"
    },
    {
        id: 3,
        name: "John Member",
        username: "member1",
        password: "1234",
        role: "member",
        currency: "NGN",
        balance: 0,
        points: 0,
        transactions: []
    }
];

let users = loadUsers();
let currentUser = null;
let selectedMember = null;


/*
=====================================================
DATABASE / STORAGE
=====================================================
*/

function loadUsers() {
    try {

        const saved = localStorage.getItem("saveEasyUsers");

        if (!saved) {
            return DEFAULT_USERS.map(user => ({
                ...user,
                transactions: Array.isArray(user.transactions)
                    ? [...user.transactions]
                    : []
            }));

        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            return DEFAULT_USERS.map(user => ({
                ...user,
                transactions: Array.isArray(user.transactions)
                    ? [...user.transactions]
                    : []
            }));

        }

        return parsed.map(user => {
            const safeUser = {
                ...user
            };

            if (safeUser.role === "saver") {
                safeUser.role = "member";
            }

            if (safeUser.role === "member") {
                safeUser.currency = safeUser.currency || "NGN";
                safeUser.balance = Number(safeUser.balance);
                safeUser.points = Number(safeUser.points);
                safeUser.transactions = Array.isArray(safeUser.transactions)
                    ? [...safeUser.transactions]
                    : [];
            }

            return safeUser;

        });
    }
    catch (error) {
        console.error(
            "Could not load users:",
            error
        );

        return DEFAULT_USERS.map(user => ({
            ...user,
            transactions: Array.isArray(user.transactions)
                ? [...user.transactions]
                : []
        }));

    }

}


function saveData() {

    try {

        localStorage.setItem(
            "saveEasyUsers",
            JSON.stringify(users)
        );
    }
    catch (error) {

        console.error(
            "Could not save data:",
            error
        );
    }

}


function repairTransactions() {

    let changed = false;

    users.forEach(user => {

        if (user.role === "saver") {

            user.role = "member";

            changed = true;
        }

        if (user.role !== "member") {

            return;
        }

        if (!Array.isArray(user.transactions)) {

            user.transactions = [];

            changed = true;
        }

        const balance =
            Number(user.balance);

        if (!Number.isFinite(balance)) {

            user.balance = 0;

            changed = true;
        }
        else if (user.balance !== balance) {

            user.balance = balance;

            changed = true;
        }

        const points =
            Number(user.points);

        if (!Number.isFinite(points)) {

            user.points = 0;

            changed = true;
        }
        else if (user.points !== points) {

            user.points = points;

            changed = true;
        }

        if (!user.currency) {

            user.currency = "NGN";

            changed = true;
        }

        user.transactions.forEach(transaction => {

            if (!transaction.id) {

                transaction.id =
                    Date.now() +
                    Math.floor(
                        Math.random() * 1000000
                    );

                changed = true;

            }

            if (!transaction.status) {

                transaction.status =
                    "Completed";

                changed = true;

            }

        });

    });

    /*
    Only save if something actually needed
    to be repaired.
    */

    if (changed) {

        saveData();

    }

}


/*
=====================================================
HELPERS
=====================================================
*/

function getElement(id) {
    return document.getElementById(id);
}


function setText(id, value) {
    const element = getElement(id);
    element.textContent = value;
}

function clearInput(id) {

    const element =
        getElement(id);

    if (element) {

        element.value = "";

    }

}

function addCell(
    row,
    value
) {

    const cell =
        document.createElement(
            "td"
        );


    cell.textContent =
        value ?? "";


    row.appendChild(
        cell
    );

}

function formatMoney(amount,currency) {
    const symbols = {
        NGN:"₦",
        USD: "$",
        GBP: "£",
        EUR: "€"
    };
    const symbol = symbols[currency];

    return (
        symbol +
        amount.toLocaleString(
            undefined,
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )
    );
}

/*
=====================================================
LOGIN / LOGOUT
=====================================================
*/

function login() {

    const username = getElement("loginUsername").value.trim();
    const password = getElement("loginPassword").value;
    const role = getElement("loginRole").value;

    const foundUser =
        users.find(user =>
            user.username.toLowerCase() === username.toLowerCase()
            && user.password === password && user.role === role
        );

    if (!foundUser) {
        showMessage("loginMessage",
            "Invalid username, password or role.",
            "error"
        );
        return;
    }

    currentUser = foundUser;

    clearInput("loginUsername");
    clearInput("loginPassword");
    hideMessage("loginMessage");
    getElement("loginPage").style.display = "none";

    if (role === "admin") {
        showAdminDashboard();
    }
    else if (role === "agent") {
        showAgentDashboard();
    }
    else {
        showMemberDashboard();
    }

}


function logout() {

    currentUser = null;

    hideDashboards();
    hideWithdrawalForm();
    hideFoundMember();

    const loginPage = getElement("loginPage");
     loginPage.style.display = "block";
}

/*
=====================================================
ADMIN - CREATE USERS
=====================================================
*/

function createMember() {

    const name = getElement("memberName")?.value.trim();
    const username = getElement("memberUsername")?.value.trim();
    const password = getElement("memberPassword")?.value;
    const currency = getElement("memberCurrency")?.value || "NGN";

    if (!name || !username || !password) {
        showMessage(
            "adminMessage",
            "Please fill all member fields.",
            "error"
        );
        return;
    }

    const exists =
        users.some(user =>
            user.username.toLowerCase() === username.toLowerCase()
        );

    if (exists) {
        showMessage(
            "adminMessage",
            "Username already exists.",
            "error"
        );
        return;
    }

    users.push({
        id: Date.now(),
        name,
        username,
        password,
        role: "member",
        currency,
        balance: 0,
        points: 0,
        transactions: []
    });

    saveData();
    clearMemberForm();
    closeModal( "memberModal");
    showAdminDashboard();
    showMessage(
        "adminMessage",
        "Member created successfully.",
        "success"
    );
}

function createAgent() {

    const name = getElement("agentName")?.value.trim();
    const username = getElement("agentUsername")?.value.trim();
    const password = getElement("agentPassword")?.value;

    if (!name || !username || !password) {
        showMessage(
            "adminMessage",
            "Please fill all agent fields.",
            "error"
        );
        return;
    }

    const exists =
        users.some(user =>
            user.username.toLowerCase() === username.toLowerCase()
        );

    if (exists) {
        showMessage(
            "adminMessage",
            "Username already exists.",
            "error"
        );
        return;
    }

    users.push({
        id: Date.now(),
        name,
        username,
        password,
        role: "agent"
    });

    saveData();
    clearAgentForm();
    closeModal( "agentModal" );
    showAdminDashboard();
    showMessage(
        "adminMessage",
        "Agent created successfully.",
        "success"
    );
}

/*
=====================================================
ADMIN DASHBOARD
=====================================================
*/

function showAdminDashboard() {

    hideDashboards();

    const dashboard = getElement("adminDashboard");
    dashboard.style.display = "block";

    let members = 0;
    let agents = 0;
    let totalMoney = 0;

    users.forEach(user => {
        if (user.role === "member") {
            members++;
            totalMoney +=
                Number(user.balance) || 0;

        }

        if (user.role === "agent") {
            agents++;
        }
    });


    setText(
        "totalMembers",
        members
    );


    setText(
        "totalAgents",
        agents
    );


    setText(
        "totalSavings",
        totalMoney.toLocaleString()
    );


    displayWithdrawalRequests();

    showAdminSection("history");

}

function showAdminSection(section) {

    const historyView =
        getElement("adminHistoryView");


    const membersView =
        getElement("adminMembersView");


    const title =
        getElement("adminSectionTitle");


    const description =
        getElement("adminSectionDescription");


    if (
        !historyView ||
        !membersView ||
        !title ||
        !description
    ) {

        return;

    }


    if (section === "members") {

        /*
        Show All Members
        */

        historyView.classList.add(
            "hidden"
        );


        membersView.classList.remove(
            "hidden"
        );


        title.textContent =
            "All Members";


        description.textContent =
            "Click a username to view the member's details.";


        displayMembers();

    }
    else {

        /*
        Show Agent Deposit History
        */

        membersView.classList.add(
            "hidden"
        );


        historyView.classList.remove(
            "hidden"
        );


        title.textContent =
            "Agent Deposit History";


        description.textContent =
            "See which agent added money to each member account.";


        displayAdminAgentHistory();

    }

}

function displayMembers() {

    const table =
        getElement("memberTable");


    if (!table) {
        return;
    }


    table.innerHTML = "";


    users
        .filter(user => user.role === "member")
        .forEach(user => {

            const row =
                document.createElement("tr");


            const cell =
                document.createElement("td");


            const usernameButton =
                document.createElement("button");


            usernameButton.type =
                "button";


            usernameButton.className =
                "username-button";


            usernameButton.textContent =
                user.username;


            usernameButton.onclick =
                function () {

                    showMemberDetails(user.id);

                };


            cell.appendChild(
                usernameButton
            );


            row.appendChild(
                cell
            );


            table.appendChild(
                row
            );

        });

}

function showMemberDetails(memberId) {

    const member =
        users.find(
            user =>
                String(user.id) ===
                String(memberId) &&
                user.role === "member"
        );


    if (!member) {

        showMessage(
            "adminMessage",
            "Member not found.",
            "error"
        );

        return;

    }


    setText(
        "detailMemberName",
        member.name
    );


    setText(
        "detailMemberUsername",
        member.username
    );


    setText(
        "detailMemberCurrency",
        member.currency || "NGN"
    );


    setText(
        "detailMemberBalance",
        formatMoney(
            member.balance,
            member.currency
        )
    );


    setText(
        "detailMemberPoints",
        Number(member.points) || 0
    );


    /*
    Get the most recent transaction date.
    */

    let latestDate =
        "No transactions";


    if (
        Array.isArray(member.transactions) &&
        member.transactions.length > 0
    ) {

        const latestTransaction =
            member.transactions[
            member.transactions.length - 1
            ];


        latestDate =
            latestTransaction.date ||
            "No date";

    }


    setText(
        "detailMemberDate",
        latestDate
    );


    openModal(
        "memberDetailsModal"
    );

}

/*
=====================================================
ADMIN - WITHDRAWAL REQUESTS
=====================================================
*/

function displayWithdrawalRequests() {

    /*
    Your supplied HTML does not contain
    withdrawalTable or pendingWithdrawals.

    This function therefore safely exits
    when those elements are not present.
    */

    const table =
        getElement(
            "withdrawalTable"
        );


    if (!table) {

        return;

    }


    table.innerHTML =
        "";


    let pendingCount =
        0;


    users
        .filter(
            user =>
                user.role === "member"
        )
        .forEach(member => {

            const transactions =
                Array.isArray(
                    member.transactions
                )
                    ? member.transactions
                    : [];


            transactions.forEach(
                transaction => {

                    if (
                        transaction.type !==
                        "Withdrawal Request"
                    ) {

                        return;

                    }


                    if (
                        transaction.status ===
                        "Pending"
                    ) {

                        pendingCount++;

                    }


                    const row =
                        document.createElement(
                            "tr"
                        );


                    addCell(
                        row,
                        member.name
                    );


                    addCell(
                        row,
                        member.username
                    );


                    addCell(
                        row,
                        formatMoney(
                            transaction.amount,
                            member.currency
                        )
                    );


                    addCell(
                        row,
                        member.currency
                    );


                    const statusCell =
                        document.createElement(
                            "td"
                        );


                    statusCell.textContent =
                        transaction.status;


                    statusCell.className =

                        transaction.status ===
                            "Completed"

                            ? "success"

                            : transaction.status ===
                                "Rejected"

                                ? "error"

                                : "pending";


                    row.appendChild(
                        statusCell
                    );


                    addCell(
                        row,
                        transaction.date
                    );


                    const actionCell =
                        document.createElement(
                            "td"
                        );


                    if (
                        transaction.status ===
                        "Pending"
                    ) {

                        const approveButton =
                            document.createElement(
                                "button"
                            );


                        approveButton.type =
                            "button";


                        approveButton.textContent =
                            "Approve";


                        approveButton.className =
                            "success-button";


                        approveButton.onclick =
                            function () {

                                approveWithdrawal(
                                    member.id,
                                    transaction.id
                                );

                            };


                        const rejectButton =
                            document.createElement(
                                "button"
                            );


                        rejectButton.type =
                            "button";


                        rejectButton.textContent =
                            "Reject";


                        rejectButton.className =
                            "danger";


                        rejectButton.onclick =
                            function () {

                                rejectWithdrawal(
                                    member.id,
                                    transaction.id
                                );

                            };


                        actionCell.appendChild(
                            approveButton
                        );


                        actionCell.appendChild(
                            rejectButton
                        );

                    }
                    else {

                        actionCell.textContent =
                            "Processed";

                    }


                    row.appendChild(
                        actionCell
                    );


                    table.appendChild(
                        row
                    );

                }
            );

        });


    setText(
        "pendingWithdrawals",
        pendingCount
    );

}


function approveWithdrawal(
    memberId,
    transactionId
) {

    if (
        !currentUser ||
        currentUser.role !== "admin"
    ) {

        showMessage(
            "adminMessage",
            "Only an administrator can approve withdrawals.",
            "error"
        );

        return;

    }


    const member =
        users.find(
            user =>
                String(user.id) ===
                String(memberId)
        );


    if (!member) {

        showMessage(
            "adminMessage",
            "Member not found.",
            "error"
        );

        return;

    }


    const transaction =
        (
            member.transactions || []
        ).find(
            transaction =>
                String(
                    transaction.id
                ) ===
                String(
                    transactionId
                )
        );


    if (!transaction) {

        showMessage(
            "adminMessage",
            "Withdrawal request not found.",
            "error"
        );

        return;

    }


    if (
        transaction.status !==
        "Pending"
    ) {

        showMessage(
            "adminMessage",
            "This withdrawal has already been processed.",
            "error"
        );

        return;

    }


    const amount =
        Number(
            transaction.amount
        );


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        showMessage(
            "adminMessage",
            "Invalid withdrawal amount.",
            "error"
        );

        return;

    }


    if (
        amount >
        Number(member.balance)
    ) {

        transaction.status =
            "Rejected";


        transaction.rejectionReason =
            "Insufficient balance.";


        transaction.rejectedBy =
            currentUser.username;


        transaction.rejectedDate =
            new Date().toLocaleString();


        saveData();


        displayWithdrawalRequests();

        displayMembers();


        showMessage(
            "adminMessage",
            "Withdrawal rejected because the member has insufficient balance.",
            "error"
        );

        return;

    }


    member.balance =
        Number(member.balance) -
        amount;


    transaction.status =
        "Completed";


    transaction.approvedBy =
        currentUser.username;


    transaction.approvedDate =
        new Date().toLocaleString();


    saveData();


    displayWithdrawalRequests();

    displayMembers();


    showMessage(
        "adminMessage",
        "Withdrawal approved successfully.",
        "success"
    );

}


function rejectWithdrawal(
    memberId,
    transactionId
) {

    if (
        !currentUser ||
        currentUser.role !== "admin"
    ) {

        showMessage(
            "adminMessage",
            "Only an administrator can reject withdrawals.",
            "error"
        );

        return;

    }


    const member =
        users.find(
            user =>
                String(user.id) ===
                String(memberId)
        );


    if (!member) {

        showMessage(
            "adminMessage",
            "Member not found.",
            "error"
        );

        return;

    }


    const transaction =
        (
            member.transactions || []
        ).find(
            transaction =>
                String(
                    transaction.id
                ) ===
                String(
                    transactionId
                )
        );


    if (!transaction) {

        showMessage(
            "adminMessage",
            "Withdrawal request not found.",
            "error"
        );

        return;

    }


    if (
        transaction.status !==
        "Pending"
    ) {

        showMessage(
            "adminMessage",
            "This withdrawal has already been processed.",
            "error"
        );

        return;

    }


    transaction.status =
        "Rejected";


    transaction.rejectedBy =
        currentUser.username;


    transaction.rejectedDate =
        new Date().toLocaleString();


    saveData();


    displayWithdrawalRequests();


    showMessage(
        "adminMessage",
        "Withdrawal rejected successfully.",
        "success"
    );

}


/*
=====================================================
ADMIN - AGENT DEPOSIT HISTORY
=====================================================
*/

function displayAdminAgentHistory() {

    const table =
        getElement(
            "adminAgentHistory"
        );

    if (!table) { return; }

    table.innerHTML = "";

    const deposits = [];

    users
        .filter(
            user =>
                user.role === "member"
        )
        .forEach(member => {

            const transactions =
                Array.isArray(
                    member.transactions
                )
                    ? member.transactions
                    : [];


            transactions.forEach(
                transaction => {

                    if (
                        transaction.type !==
                        "Deposit"
                    ) {

                        return;

                    }


                    deposits.push({

                        transaction,

                        member

                    });

                }
            );

        });


    /*
    Newest deposits first.
    Uses transaction ID when available,
    because toLocaleString() is not reliably
    sortable across all browsers.
    */

    deposits.sort(
        (a, b) =>
            Number(
                b.transaction.id
            ) -
            Number(
                a.transaction.id
            )
    );


    deposits.forEach(
        ({ transaction, member }) => {

            const row =
                document.createElement(
                    "tr"
                );


            addCell(
                row,
                transaction.agent ||
                "Unknown"
            );


            addCell(
                row,
                member.name
            );


            addCell(
                row,
                member.username
            );


            addCell(
                row,
                formatMoney(
                    transaction.amount,
                    member.currency
                )
            );


            addCell(
                row,
                member.currency
            );


            addCell(
                row,
                transaction.points || 0
            );


            addCell(
                row,
                transaction.date
            );


            table.appendChild(
                row
            );

        }
    );

}


/*
=====================================================
AGENT DASHBOARD
=====================================================
*/

function showAgentDashboard() {

    hideDashboards();


    const dashboard =
        getElement("agentDashboard");


    if (!dashboard) {
        return;
    }


    dashboard.style.display =
        "block";


    setText(
        "agentWelcome",
        "Welcome, " +
        currentUser.name
    );


    loadMemberList();

    displayAgentHistory();

    displayAgentWithdrawalRequests();

}


/*
=====================================================
AGENT - MEMBER SEARCH
=====================================================
*/

function searchMember() {

    const search =
        getElement(
            "agentMemberSearch"
        )?.value
            .toLowerCase()
            .trim();


    selectedMember =
        null;


    if (!search) {

        hideFoundMember();

        return;

    }


    selectedMember =
        users.find(user => {

            if (
                user.role !==
                "member"
            ) {

                return false;

            }


            return (

                String(
                    user.username
                )
                    .toLowerCase()
                    .includes(search)

                ||

                String(
                    user.name
                )
                    .toLowerCase()
                    .includes(search)

            );

        });


    if (!selectedMember) {

        hideFoundMember();

        return;

    }


    const foundMember =
        getElement(
            "foundMember"
        );


    if (foundMember) {

        foundMember.classList.remove(
            "hidden"
        );

    }


    setText(
        "foundMemberName",
        selectedMember.name
    );


    setText(
        "foundMemberUsername",
        selectedMember.username
    );


    setText(
        "foundMemberCurrency",
        selectedMember.currency
    );


    setText(
        "foundMemberBalance",
        formatMoney(
            selectedMember.balance,
            selectedMember.currency
        )
    );

}


function loadMemberList() {

    const list =
        getElement(
            "memberList"
        );


    if (!list) {

        return;

    }


    list.innerHTML =
        "";


    users
        .filter(
            user =>
                user.role === "member"
        )
        .forEach(user => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                user.username;


            option.label =
                user.name +
                " - " +
                user.currency;


            list.appendChild(
                option
            );

        });

}


/*
=====================================================
AGENT - ADD SAVINGS
=====================================================
*/

function addSavings() {

    if (!selectedMember) {

        showMessage(
            "agentMessage",
            "Find a member first.",
            "error"
        );

        return;

    }


    const amount =
        Number(
            getElement(
                "depositAmount"
            )?.value
        );


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        showMessage(
            "agentMessage",
            "Enter a valid amount.",
            "error"
        );

        return;

    }


    selectedMember.balance =
        Number(
            selectedMember.balance
        ) + amount;


    /*
    1 point for every ₦100
    */

    const earnedPoints =
        Math.floor(
            amount / 100
        );


    selectedMember.points =
        Number(
            selectedMember.points
        ) + earnedPoints;


    if (
        !Array.isArray(
            selectedMember.transactions
        )
    ) {

        selectedMember.transactions =
            [];

    }


    selectedMember.transactions.push({

        id:
            Date.now(),

        type:
            "Deposit",

        amount,

        points:
            earnedPoints,

        status:
            "Completed",

        date:
            new Date().toLocaleString(),

        agent:
            currentUser.username

    });


    saveData();


    clearInput(
        "depositAmount"
    );


    setText(
        "foundMemberBalance",
        formatMoney(
            selectedMember.balance,
            selectedMember.currency
        )
    );


    displayAgentHistory();

    displayAdminAgentHistory();


    showMessage(
        "agentMessage",
        "Money successfully added to " +
        selectedMember.name +
        ". " +
        earnedPoints +
        " point(s) earned.",
        "success"
    );

}


/*
=====================================================
AGENT - DEPOSIT HISTORY
=====================================================
*/

function displayAgentHistory() {

    const table =
        getElement(
            "agentHistory"
        );


    if (
        !table ||
        !currentUser
    ) {

        return;

    }


    table.innerHTML =
        "";


    users
        .filter(
            user =>
                user.role === "member"
        )
        .forEach(member => {

            const transactions =
                Array.isArray(
                    member.transactions
                )
                    ? member.transactions
                    : [];


            for (
                let i =
                    transactions.length - 1;

                i >= 0;

                i--
            ) {

                const transaction =
                    transactions[i];


                if (
                    transaction.type !==
                    "Deposit"
                ) {

                    continue;

                }


                if (
                    transaction.agent !==
                    currentUser.username
                ) {

                    continue;

                }


                const row =
                    document.createElement(
                        "tr"
                    );


                addCell(
                    row,
                    member.name
                );


                addCell(
                    row,
                    formatMoney(
                        transaction.amount,
                        member.currency
                    )
                );


                addCell(
                    row,
                    member.currency
                );


                addCell(
                    row,
                    transaction.date
                );


                table.appendChild(
                    row
                );

            }

        });

}


function displayAgentWithdrawalRequests() {

    /*
    Your supplied HTML does not contain
    agentWithdrawalTable.

    Therefore this function safely does nothing
    when that element is absent.
    */

    const table =
        getElement(
            "agentWithdrawalTable"
        );


    if (!table) {

        return;

    }


    table.innerHTML =
        "";


    users
        .filter(
            user =>
                user.role === "member"
        )
        .forEach(member => {

            const transactions =
                member.transactions || [];


            transactions.forEach(
                transaction => {

                    if (
                        transaction.type !==
                        "Withdrawal Request"
                    ) {

                        return;

                    }


                    const row =
                        document.createElement(
                            "tr"
                        );


                    addCell(
                        row,
                        member.name
                    );


                    addCell(
                        row,
                        member.username
                    );


                    addCell(
                        row,
                        formatMoney(
                            transaction.amount,
                            member.currency
                        )
                    );


                    addCell(
                        row,
                        member.currency
                    );


                    addCell(
                        row,
                        transaction.status
                    );


                    addCell(
                        row,
                        transaction.date
                    );


                    table.appendChild(
                        row
                    );

                }
            );

        });

}


/*
=====================================================
MEMBER DASHBOARD
=====================================================
*/

function showMemberDashboard() {

    hideDashboards();


    const dashboard =
        getElement(
            "memberDashboard"
        );


    if (!dashboard) {
        return;
    }


    dashboard.style.display =
        "block";


    setText(
        "memberWelcome",
        "Welcome, " +
        currentUser.name
    );


    updateMemberDashboard();

}


function updateMemberDashboard() {

    if (!currentUser) {

        return;

    }


    setText(
        "myBalance",
        formatMoney(
            currentUser.balance,
            currentUser.currency
        )
    );


    setText(
        "withdrawBalance",
        formatMoney(
            currentUser.balance,
            currentUser.currency
        )
    );


    setText(
        "myPoints",
        currentUser.points
    );


    displayMemberHistory();

}


/*
=====================================================
MEMBER - WITHDRAWAL
=====================================================
*/

function requestWithdrawal() {

    if (!currentUser) {

        return;

    }


    const amount =
        Number(
            getElement(
                "withdrawAmount"
            )?.value
        );


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        showMessage(
            "memberMessage",
            "Enter a valid withdrawal amount.",
            "error"
        );

        return;

    }


    if (
        amount >
        Number(currentUser.balance)
    ) {

        showMessage(
            "memberMessage",
            "Insufficient balance.",
            "error"
        );

        return;

    }


    const transactions =
        Array.isArray(
            currentUser.transactions
        )
            ? currentUser.transactions
            : [];


    const pendingRequest =
        transactions.some(
            transaction =>

                transaction.type ===
                "Withdrawal Request" &&

                transaction.status ===
                "Pending"

        );


    if (pendingRequest) {

        showMessage(
            "memberMessage",
            "You already have a pending withdrawal request.",
            "error"
        );

        return;

    }


    currentUser.transactions =
        transactions;


    currentUser.transactions.push({

        id:
            Date.now(),

        type:
            "Withdrawal Request",

        amount,

        points:
            0,

        status:
            "Pending",

        date:
            new Date().toLocaleString(),

        agent:
            null

    });


    saveData();


    clearInput(
        "withdrawAmount"
    );


    hideWithdrawalForm();


    displayMemberHistory();


    showMessage(
        "memberMessage",
        "Withdrawal request submitted successfully.",
        "success"
    );

}


function showWithdrawalForm() {

    const form =
        getElement(
            "withdrawalForm"
        );


    if (!form) {

        return;

    }


    form.classList.remove(
        "hidden"
    );


    if (currentUser) {

        setText(
            "withdrawBalance",
            formatMoney(
                currentUser.balance,
                currentUser.currency
            )
        );

    }

}


function hideWithdrawalForm() {

    const form =
        getElement(
            "withdrawalForm"
        );


    if (form) {

        form.classList.add(
            "hidden"
        );

    }

}


/*
=====================================================
MEMBER - HISTORY
=====================================================
*/

function displayMemberHistory() {

    const table =
        getElement(
            "memberHistory"
        );


    if (
        !table ||
        !currentUser
    ) {

        return;

    }


    table.innerHTML =
        "";


    const transactions =
        Array.isArray(
            currentUser.transactions
        )
            ? currentUser.transactions
            : [];


    for (
        let i =
            transactions.length - 1;

        i >= 0;

        i--
    ) {

        const transaction =
            transactions[i];


        const row =
            document.createElement(
                "tr"
            );


        addCell(
            row,
            transaction.type
        );


        addCell(
            row,
            transaction.agent || "-"
        );


        addCell(
            row,
            formatMoney(
                transaction.amount,
                currentUser.currency
            )
        );


        addCell(
            row,
            transaction.points || 0
        );


        const statusCell =
            document.createElement(
                "td"
            );


        statusCell.textContent =
            transaction.status;


        if (
            transaction.status ===
            "Completed"
        ) {

            statusCell.className =
                "success";

        }
        else if (
            transaction.status ===
            "Rejected"
        ) {

            statusCell.className =
                "error";

        }
        else {

            statusCell.className =
                "pending";

        }


        row.appendChild(
            statusCell
        );


        addCell(
            row,
            transaction.date
        );


        table.appendChild(
            row
        );

    }

}


/*
=====================================================
MEMBER - POINTS
=====================================================
*/

function convertPoints() {
    if (!currentUser) {
        return;
    }

    const points = Number(currentUser.points) || 0;

    if (points < 30) {
        const remaining = 30 - points;

        setText(
            "pointsInfo",
            "You need " + remaining + " more point(s)."
        );

        showMessage(
            "memberMessage",
            "You need at least 30 points to convert.",
            "error"
        );

        return;
    }

    // 30 points = 15 units
    const conversions = Math.floor(points / 30);
    const money = conversions * 15;
    const pointsUsed = conversions * 30;

    currentUser.points = points - pointsUsed;

    currentUser.balance =
        Number(currentUser.balance) + money;

    if (!Array.isArray(currentUser.transactions)) {
        currentUser.transactions = [];
    }

    currentUser.transactions.push({
        id: Date.now(),
        type: "Points Reward",
        amount: money,
        points: pointsUsed,
        status: "Completed",
        date: new Date().toLocaleString(),
        agent: null
    });

    saveData();
    updateMemberDashboard();

    setText(
        "pointsInfo",
        "30 points = 15 unit"
    );

    showMessage(
        "memberMessage",
        money + " " + currentUser.currency +
        " added to your balance.",
        "success"
    );
}


/*
=====================================================
UI / VISIBILITY
=====================================================
*/

function hideFoundMember() {

    const element =
        getElement(
            "foundMember"
        );


    if (element) {

        element.classList.add(
            "hidden"
        );

    }

}


function hideDashboards() {

    [
        "adminDashboard",
        "agentDashboard",
        "memberDashboard"

    ].forEach(id => {

        const element =
            getElement(id);


        if (element) {

            element.style.display =
                "none";

        }

    });

}


/*
=====================================================
MODALS
=====================================================
*/

function openModal(
    modalId
) {

    const modal =
        getElement(
            modalId
        );


    if (!modal) {

        console.error(
            "Modal not found:",
            modalId
        );

        return;

    }


    modal.classList.add(
        "active"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeModal(
    modalId
) {

    const modal =
        getElement(
            modalId
        );


    if (!modal) {

        console.error(
            "Modal not found:",
            modalId
        );

        return;

    }


    modal.classList.remove(
        "active"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


function closeModalOnOutsideClick(
    event
) {

    if (
        event.target.classList.contains(
            "modal"
        )
    ) {

        event.target.classList.remove(
            "active"
        );


        document.body.classList.remove(
            "modal-open"
        );

    }

}


/*
=====================================================
MESSAGES
=====================================================
*/

function showMessage(
    elementId,
    message,
    type
) {

    const element =
        getElement(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.style.display =
        "block";


    if (
        type ===
        "success"
    ) {

        element.className =
            "message success-message";

    }
    else {

        element.className =
            "message error-message";

    }


    clearTimeout(
        element.messageTimer
    );


    element.messageTimer =
        setTimeout(
            () => {

                element.style.display =
                    "none";

            },
            4000
        );

}


function hideMessage(
    elementId
) {

    const element =
        getElement(
            elementId
        );


    if (element) {

        element.style.display =
            "none";

    }

}


/*
=====================================================
CLEAR FORMS
=====================================================
*/

function clearMemberForm() {

    clearInput(
        "memberName"
    );


    clearInput(
        "memberUsername"
    );


    clearInput(
        "memberPassword"
    );

}


function clearAgentForm() {

    clearInput(
        "agentName"
    );


    clearInput(
        "agentUsername"
    );


    clearInput(
        "agentPassword"
    );

}


/*
=====================================================
INITIALIZE
=====================================================
*/

function initializeApp() {
    repairTransactions();
    hideDashboards();
    hideWithdrawalForm();
    hideFoundMember();

}

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );
}
else {
    initializeApp();

}
