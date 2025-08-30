// Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel loaded');

    // Add any client-side functionality here

    // Example: Confirm logout
    const logoutForm = document.querySelector('form[action="/admin/logout"]');
    if (logoutForm) {
        logoutForm.addEventListener('submit', function(e) {
            const confirmLogout = confirm('Are you sure you want to logout?');
            if (!confirmLogout) {
                e.preventDefault();
            }
        });
    }

    // Example: Add some basic validation for login form
    const loginForm = document.querySelector('form[action="/admin/login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!username || !password) {
                alert('Please fill in all fields');
                e.preventDefault();
                return;
            }

            // Additional client-side validation can be added here
        });
    }
});