document.addEventListener('DOMContentLoaded', async () => {
    let userToken = localStorage.getItem('token');

    if (!userToken) {
        console.error('User not authenticated');
        alert('Access denied. Please log in.');
        window.location.href = 'index.html';
        return;
    }

    // ✅ Ensure token format is correct
    userToken = userToken.replace(/^"|"$/g, '').trim();

    console.log("Auth Token:", userToken);

    if (userToken.split('.').length !== 3) {
        console.error('Malformed token detected:', userToken);
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
        return;
    }

    try {
        // 🔍 Fetching user data from GraphQL
        const userData = await fetchUserData(userToken);

        if (!userData) {
            alert('Failed to load user details.');
            return;
        }

        // 🎯 Updating UI with user data
        displayUserInfo(userData.user);
        generateUserCharts(userData.transactions, userData.user.totalUp, userData.user.totalDown, userData.xpDistribution);

    } catch (error) {
        console.error('Profile Load Error:', error.message);
        alert('An error occurred while loading your data.');
    }
});

// 📌 Function to request user data from GraphQL
async function fetchUserData(authToken) {
    try {
        const response = await fetch('https://adam-jerusalem.nd.edu/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                query {
                    user {
                        firstName
                        lastName
                        email
                        auditRatio
                        totalUp
                        totalDown
                    }
                    transaction {
                        amount
                        createdAt
                        type
                    }
                    result {
                        grade
                        objectId
                        type
                    }
                    progress {
                        grade
                        objectId
                    }
                }
                `,
            }),
        });

        const data = await response.json();
        console.log("Fetched Data:", data);

        if (!response.ok || data.errors) {
            console.error('GraphQL Error:', JSON.stringify(data.errors, null, 2));
            return null;
        }

        // 📊 XP Distribution Breakdown
        let xpFromProjects = 0;
        let xpFromAudits = 0;
        let xpFromQuests = 0;

        data.data.result.forEach(res => {
            if (res.type === 'tester') xpFromProjects += res.grade;
            if (res.type === 'user_audit') xpFromAudits += res.grade;
            if (res.type === 'quest') xpFromQuests += res.grade;
        });

        return {
            user: data.data.user[0],
            transactions: data.data.transaction || [],
            xpDistribution: {
                projects: xpFromProjects,
                audits: xpFromAudits,
                quests: xpFromQuests
            }
        };

    } catch (error) {
        console.error('Data Fetch Error:', error.message);
        return null;
    }
}

// 🎨 Function to update profile details
function displayUserInfo(user) {
    document.getElementById('first-name').textContent = user.firstName || 'N/A';
    document.getElementById('last-name').textContent = user.lastName || 'N/A';
    document.getElementById('email').textContent = user.email || 'N/A';
    document.getElementById('xp-earned').textContent = user.totalUp || 0;
    document.getElementById('audit-ratio').textContent = user.auditRatio?.toFixed(2) || 'N/A';
}

// 📊 Function to create user charts
function generateUserCharts(transactions, xpGained, xpLost, xpDistribution) {
    const xpHistory = transactions.map(t => ({
        date: new Date(t.createdAt).toLocaleDateString(),
        xp: t.amount,
    }));

    const timeLabels = xpHistory.map(t => t.date);
    const xpValues = xpHistory.map(t => t.xp);

    // 📈 XP Progress Chart (Bar)
    new Chart(document.getElementById('xpChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'XP Over Time',
                data: xpValues,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // 🌐 XP Distribution (Radar Chart)
    new Chart(document.getElementById('xpRadarChart').getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['Projects', 'Audits', 'Quests'],
            datasets: [{
                label: 'XP Breakdown',
                data: [xpDistribution.projects, xpDistribution.audits, xpDistribution.quests],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: { beginAtZero: true }
            }
        }
    });

    // 📊 XP Gained from Events (Stacked Bar Chart)
    const eventLabels = ['Piscine', 'Raids', 'Exams', 'Projects'];
    const eventXP = [
        Math.floor(Math.random() * 500),
        Math.floor(Math.random() * 500),
        Math.floor(Math.random() * 500),
        Math.floor(Math.random() * 500)
    ];

    new Chart(document.getElementById('xpEventChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: eventLabels,
            datasets: [{
                label: 'XP Earned',
                data: eventXP,
                backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#FF33A1']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
