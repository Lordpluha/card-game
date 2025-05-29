import UserService from "../api/User.service.js";
import AuthService from "../api/Auth.service.js";

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await UserService.getUser();
        if (!user || user.error) {
            window.location.href = "/pages/login.html";
            return;
        }
    } catch (error) {
        console.error('Помилка перевірки авторизації:', error);
        window.location.href = "/pages/login.html";
        return;
    }
    const avatarElement = document.getElementById('user-avatar');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const passwordFields = document.getElementById('password-fields');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const saveBtn = document.getElementById('save-changes');
    const cancelBtn = document.getElementById('cancel-changes');
    const avatarUpload = document.getElementById('avatar-upload');
    const logoutBtn = document.getElementById('logoutBtn');

    let userData = null;
    let isPasswordFormVisible = false;
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await AuthService.logout();
                window.location.href = "/pages/login.html";
            } catch (error) {
                console.error('Помилка при виході:', error);
                alert('Не вдалося вийти з акаунту. Спробуйте ще раз.');
            }
        });
    }

    async function loadUserData() {
        try {
            const response = await UserService.getUser();
            if (response && !response.error) {
                userData = response;
                updateUserUI();
                
                document.title = `${userData.username} | Профіль | Card Game`;
            } else {
                throw new Error(response?.error || 'Не вдалося завантажити дані користувача');
            }
        } catch (error) {
            console.error('Помилка при завантаженні даних користувача:', error);
            if (window.location.pathname !== '/pages/login.html') {
                window.location.href = '/pages/login.html';
            }
        }
    }

    function updateUserUI() {
        if (!userData) return;

        let avatarSrc = null;
        
        const savedAvatar = localStorage.getItem('user_avatar');
        if (savedAvatar) {
            avatarSrc = savedAvatar;
        } else if (userData.avatar_url) {
            avatarSrc = userData.avatar_url;
        } else {
            avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=random`;
        }
        
        if (avatarElement && avatarSrc) {
            avatarElement.src = avatarSrc;
            
            avatarElement.onerror = () => {
                console.log('Помилка завантаження аватара, використовуємо заглушку');
                avatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=random`;
            };
        }

        if (usernameInput) usernameInput.value = userData.username || '';
        if (emailInput) emailInput.value = userData.email || '';
        
        document.title = `${userData.username} | Профіль | Card Game`;
    }

    function updateAvatar(avatarUrl) {
        console.log('Оновлення аватара з URL:', avatarUrl);
        
        let avatarSrc = avatarUrl;
        
        if (avatarUrl === 'local_avatar') {
            avatarSrc = localStorage.getItem('user_avatar');
            console.log('Використовуємо локальний аватар');
        }
        
        if (!avatarSrc) {
            console.log('Помилка: джерело аватара не знайдено');
            if (userData && userData.username) {
                avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=random`;
            }
        }
        
        if (avatarSrc) {
            const profileAvatar = document.getElementById('user-avatar');
            if (profileAvatar) {
                profileAvatar.src = avatarSrc;
                console.log('Аватар оновлено в профілі');
            }
            
            const headerAvatar = document.querySelector('.user-avatar');
            if (headerAvatar) {
                headerAvatar.src = avatarSrc;
                console.log('Аватар оновлено в хедері');
            }
        }
    }

    async function loadUserDataAndUpdateAvatar() {
        try {
            await loadUserData();
            
            if (userData) {
                if (userData.avatar_url) {
                    console.log('Використовуємо аватар з сервера:', userData.avatar_url);
                    updateAvatar(userData.avatar_url);
                } else {
                    const savedAvatar = localStorage.getItem('user_avatar');
                    if (savedAvatar) {
                        console.log('Знайдено збережений аватар у localStorage');
                        updateAvatar(savedAvatar);
                    } else {
                        console.log('Аватар не знайдено, використовуємо заглушку');
                        updateAvatar(`https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=random`);
                    }
                }
            }
        } catch (error) {
            console.error('Помилка при завантаженні даних користувача:', error);
        }
    }
    
    await loadUserDataAndUpdateAvatar();

    if (avatarUpload) {
        avatarUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // перевірка розміру файлу (не більше 2мб)
            if (file.size > 2 * 1024 * 1024) {
                showAvatarError('Розмір файлу не повинен перевищувати 2MB');
                return;
            }

            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                showAvatarError('Дозволені лише зображення (JPEG, PNG, GIF, WebP)');
                return;
            }

            const originalBtnText = saveBtn ? saveBtn.innerHTML : '<i class="fas fa-save"></i> Зберегти зміни';
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Завантаження аватара...';
            }

            try {
                console.log('Початок обробки аватарки...');
                
                const optimizeImage = (file, maxWidth = 400, quality = 0.7) => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        img.onload = () => {
                            let width = img.width;
                            let height = img.height;
                            
                            if (width > maxWidth) {
                                height = Math.round((height * maxWidth) / width);
                                width = maxWidth;
                            }
                            
                            canvas.width = width;
                            canvas.height = height;
                            
                            ctx.drawImage(img, 0, 0, width, height);
                            
                            const optimizedImage = canvas.toDataURL('image/jpeg', quality);
                            resolve(optimizedImage);
                        };
                        
                        img.onerror = () => {
                            const reader = new FileReader();
                            reader.onload = (e) => resolve(e.target.result);
                            reader.readAsDataURL(file);
                        };
                        
                        img.src = URL.createObjectURL(file);
                    });
                };
                
                const MAX_FILE_SIZE = 200 * 1024;
                if (file.size > MAX_FILE_SIZE) {
                    throw new Error('Розмір файлу перевищує 200KB. Будь ласка, виберіть менше зображення.');
                }
                
                console.log('Оптимізація зображення...');
                const optimizedImage = await optimizeImage(file);
                
                console.log('Відправка аватара на сервер...');
                console.log('Розмір даних:', (optimizedImage.length * 3/4).toFixed(2) + ' bytes');
                
                try {
                    const response = await UserService.updateSettings({
                        avatar_url: optimizedImage
                    });
                    
                    console.log('Відповідь від сервера:', response);
                    
                    if (response && !response.error) {
                        userData = { ...userData, avatar_url: optimizedImage };
                        console.log('Оновлено URL аватарки в об\'єкті користувача');
                        
                        localStorage.setItem('user_avatar', optimizedImage);
                        
                        if (avatarElement) {
                            avatarElement.src = optimizedImage;
                        }
                        updateAvatar(optimizedImage);
                        
                        updateUserUI();
                        
                        showNotification('Аватар успішно оновлено', 'success');
                        
                        console.log('Аватар успішно оновлено');
                    } else {
                        throw new Error(response?.error || response?.message || 'Помилка при оновленні аватара');
                    }
                } catch (error) {
                    console.error('Помилка при оновленні аватара:', error);
                    showAvatarError('Не вдалося завантажити аватар. Спробуйте ще раз.');
                    throw error;
                }
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalBtnText;
                }
                
                if (avatarUpload) {
                    avatarUpload.value = '';
                }
            }
        });
    }

    function showAvatarError(message) {
        const errorElement = document.getElementById('avatar-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        } else {
            console.error('Avatar error element not found:', message);
            showNotification(message, 'error');
        }
    }

    function hideAvatarError() {
        const errorElement = document.getElementById('avatar-error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isPasswordFormVisible = !isPasswordFormVisible;
            
            if (isPasswordFormVisible) {
                if (passwordFields) {
                    passwordFields.style.display = 'block';
                    passwordFields.style.maxHeight = passwordFields.scrollHeight + 'px';
                    passwordFields.classList.add('visible');
                }
                
                changePasswordBtn.innerHTML = '<i class="fas fa-times"></i> Скасувати';
                changePasswordBtn.classList.remove('btn-secondary');
                changePasswordBtn.classList.add('btn-outline');
                
                if (passwordFields) {
                    passwordFields.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            } else {
                if (passwordFields) {
                    passwordFields.style.maxHeight = '0';
                    setTimeout(() => {
                        passwordFields.style.display = 'none';
                    }, 300);
                    passwordFields.classList.remove('visible');
                }
                
                changePasswordBtn.innerHTML = '<i class="fas fa-key"></i> Змінити пароль';
                changePasswordBtn.classList.remove('btn-outline');
                changePasswordBtn.classList.add('btn-secondary');
                
                if (currentPasswordInput) currentPasswordInput.value = '';
                if (newPasswordInput) newPasswordInput.value = '';
                if (confirmPasswordInput) confirmPasswordInput.value = '';
            }
        });
        
        changePasswordBtn.innerHTML = '<i class="fas fa-key"></i> Змінити пароль';
        changePasswordBtn.classList.add('btn-secondary');
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (passwordFields) {
                passwordFields.style.maxHeight = '0';
                passwordFields.classList.remove('visible');
                setTimeout(() => {
                    passwordFields.style.display = 'none';
                }, 300);
            }
            
            if (changePasswordBtn) {
                changePasswordBtn.innerHTML = '<i class="fas fa-key"></i> Змінити пароль';
                changePasswordBtn.classList.remove('btn-outline');
                changePasswordBtn.classList.add('btn-secondary');
            }
            
            updateUserUI();
            
            if (currentPasswordInput) currentPasswordInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
            
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        cancelBtn.classList.add('btn-outline');
    }
            
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Зберігання...';
            
            try {
                const updates = {};
                let hasChanges = false;
                
                if (usernameInput && usernameInput.value.trim() !== userData.username) {
                    updates.username = usernameInput.value.trim();
                    hasChanges = true;
                }
                
                if (isPasswordFormVisible) {
                    const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : '';
                    const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';
                    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';
                    
                    if (!currentPassword) {
                        throw new Error('Будь ласка, введіть поточний пароль');
                    }
                    
                    if (!newPassword) {
                        throw new Error('Будь ласка, введіть новий пароль');
                    }
                    
                    if (newPassword.length < 6) {
                        throw new Error('Новий пароль повинен містити принаймні 6 символів');
                    }
                    
                    if (newPassword !== confirmPassword) {
                        throw new Error('Нові паролі не збігаються');
                    }
                    
                    updates.currentPassword = currentPassword;
                    updates.newPassword = newPassword;
                    hasChanges = true;
                }
                
                if (hasChanges) {
                    const response = await UserService.updateSettings(updates);
                    
                    if (response && !response.error) {
                        userData = { ...userData, ...response };
                        updateUserUI();
                        
                        if (currentPasswordInput) currentPasswordInput.value = '';
                        if (newPasswordInput) newPasswordInput.value = '';
                        if (confirmPasswordInput) confirmPasswordInput.value = '';
                        
                        if (changePasswordBtn) {
                            changePasswordBtn.innerHTML = '<i class="fas fa-key"></i> Змінити пароль';
                            changePasswordBtn.classList.remove('btn-outline');
                            changePasswordBtn.classList.add('btn-secondary');
                        }
                        
                        if (passwordFields) {
                            passwordFields.style.maxHeight = '0';
                            setTimeout(() => {
                                passwordFields.style.display = 'none';
                            }, 300);
                            passwordFields.classList.remove('visible');
                        }
                        
                        isPasswordFormVisible = false;
                        
                        showNotification('Зміни успішно збережено!', 'success');
                        
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    } else {
                        throw new Error(response?.error || 'Помилка при збереженні змін');
                    }
                } else {
                    showNotification('Немає змін для збереження', 'info');
                }
            } catch (error) {
                console.error('Помилка при збереженні змін:', error);
                showNotification(`Помилка: ${error.message || 'Не вдалося зберегти зміни'}`, 'error');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Зберегти зміни';
                }
            }
        });
        
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Зберегти зміни';
        saveBtn.classList.add('btn-primary');
    }
    
    function showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
        
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.classList.add('hide');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    function showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.classList.add('hide');
                setTimeout(() => notification.remove(), 300);
            });
        }
        
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.classList.add('hide');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 1000;
            max-width: 350px;
            opacity: 0;
            transform: translateX(120%);
            transition: opacity 0.3s, transform 0.3s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .notification.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .notification.hide {
            opacity: 0;
            transform: translateX(120%);
        }
        
        .notification-success {
            background: #10b981;
            border-left: 4px solid #059669;
        }
        
        .notification-error {
            background: #ef4444;
            border-left: 4px solid #dc2626;
        }
        
        .notification-info {
            background: #3b82f6;
            border-left: 4px solid #2563eb;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0 0 0 15px;
            margin: 0;
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.querySelectorAll('.notification').forEach(notification => {
            notification.classList.add('show');
        });
    }, 100);
});
