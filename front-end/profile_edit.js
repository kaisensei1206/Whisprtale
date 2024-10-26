document.addEventListener("DOMContentLoaded", () => {
    loadProfileData(); // Load current profile data when the page loads
    handleImageUploadAndCropping(); // Handle image upload and cropping
    setupSaveButton(); // Set up the save changes button

    document.getElementById("camera-icon").addEventListener("click", () => {
        document.getElementById("upload-image").click();
    });

    const cropModal = document.getElementById("cropModal");
    cropModal.style.display = 'none';
});

let userId;

function loadProfileData() {
    fetch('http://localhost:3001/auth/status', {
        credentials: 'include'
    })
        .then(response => response.json())
        .then(statusData => {
            if (statusData.isLoggedIn) {
                userId = statusData.user.userId; // Obtain the userId from auth/status
                console.log("Loaded User ID from auth/status:", userId);

                if (!userId) {
                    console.error("Failed to retrieve userId.");
                    alert("Failed to retrieve userId. Please try reloading the page.");
                    return;
                }

                fetch('http://localhost:3001/api/profile', {
                    credentials: 'include'
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.user) {
                            document.getElementById("username").value = data.user.account || "";
                            document.getElementById("email").value = data.user.email || "";
                            document.getElementById("phonenum").value = data.user.phoneNumber || "";
                            document.getElementById("realname").value = data.user.realname || "";
                            document.getElementById("bday").value = data.user.bday || "";

                            const userAvatar = document.getElementById("profile-picture");
                            if (data.user.profilePicture) {
                                let imageUrl;

                                if (data.user.profilePicture.includes('http') || data.user.profilePicture.includes('https')) {
                                    imageUrl = data.user.profilePicture;
                                } else {
                                    imageUrl = `http://localhost:3001/auth/image/${data.user.profilePicture}`;
                                }

                                console.log('Profile picture URL:', imageUrl);
                                userAvatar.src = imageUrl;

                                userAvatar.onerror = () => {
                                    console.error('Failed to load profile picture, falling back to default image.');
                                    userAvatar.src = 'pictures/user_avatar.png';
                                };
                            } else {
                                userAvatar.src = 'pictures/user_avatar.png'; // Fallback image
                            }
                        } else {
                            console.error("User data not found.");
                        }
                    })
                    .catch(error => console.error("Error loading profile data:", error));
            } else {
                console.error("User is not logged in.");
                alert("You must be logged in to edit your profile.");
            }
        })
        .catch(error => console.error("Error fetching auth status:", error));
}

function saveProfileChanges() {
    if (!userId) {
        console.error("User ID is not available.");
        alert("Unable to save changes: User ID is missing.");
        return;
    }

    const updatedData = {
        userId: userId,
        username: document.getElementById("username").value,
        phoneNumber: document.getElementById("phonenum").value,
        realname: document.getElementById("realname").value,
        bday: document.getElementById("bday").value,
    };

    console.log("Save button clicked");
    console.log("Updated data:", updatedData);

    // Check if there are any changes
    let isChanged = false;
    for (let key in updatedData) {
        if (updatedData[key] && updatedData[key] !== "") {
            isChanged = true;
            break;
        }
    }

    if (!isChanged) {
        console.log("No changes detected, skipping update.");
        return;
    }

    fetch('http://localhost:3001/api/profile_edit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updatedData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Profile updated successfully");
                window.location.href = "profile.html";
            } else {
                console.error("Failed to save profile changes:", data.message);
                alert(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            console.error("Error saving profile changes:", error);
            alert("An unexpected error occurred while saving profile changes.");
        });
}


function handleImageUploadAndCropping() {
    const uploadImageInput = document.getElementById("upload-image");
    const cropModal = document.getElementById("cropModal");
    const cropImage = document.getElementById("crop-image");
    const cropButton = document.getElementById("crop-button");
    let cropper;

    if (uploadImageInput) {
        uploadImageInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    cropImage.src = event.target.result;
                    cropImage.onload = () => {
                        cropModal.style.display = 'flex';

                        if (cropper) {
                            cropper.destroy();
                        }

                        cropper = new Cropper(cropImage, {
                            aspectRatio: 1,
                            viewMode: 1,
                            dragMode: 'move',
                            autoCropArea: 1,
                            restore: false,
                            guides: false,
                            center: false,
                            highlight: false,
                            cropBoxMovable: false,
                            cropBoxResizable: false,
                            toggleDragModeOnDblclick: false,
                        });
                    };
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (cropButton) {
        cropButton.addEventListener("click", () => {
            if (cropper) {
                const canvas = cropper.getCroppedCanvas({
                    width: 200,
                    height: 200,
                });
                canvas.toBlob((blob) => {
                    if (!userId) {
                        console.error("User ID is not available.");
                        alert("User ID is missing. Unable to upload the image.");
                        return;
                    }

                    const formData = new FormData();
                    formData.append("profilePicture", blob, "profile.jpg");
                    formData.append("userId", userId);

                    console.log("FormData to be sent:");
                    for (let pair of formData.entries()) {
                        console.log(pair[0] + ': ' + pair[1]);
                    }

                    fetch('http://localhost:3001/api/upload-profile-picture', {
                        method: 'POST',
                        credentials: 'include',
                        body: formData
                    })
                        .then(response => {
                            console.log("Upload response status:", response.status);
                            return response.json();
                        })
                        .then(data => {
                            if (data.success) {
                                document.getElementById("profile-picture").src = data.newProfilePictureUrl;
                                alert("Profile picture updated successfully!");
                                cropModal.style.display = 'none';
                            } else {
                                console.error("Failed to update profile picture:", data.message);
                            }
                        })
                        .catch(error => console.error("Error uploading profile picture:", error));
                });
            }
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === cropModal) {
            cropModal.style.display = 'none';
        }
    });
}

function setupSaveButton() {
    const saveButton = document.getElementById("save-changes-button");
    if (saveButton) {
        saveButton.addEventListener("click", (e) => {
            e.preventDefault();
            saveProfileChanges();
        });
    }
}

function loadNavigation() {
    fetch('navigation.html', {
        credentials: 'include'
    })
        .then(response => response.text())
        .then(data => {
            document.getElementById('nav-placeholder').innerHTML = data;
            console.log('Navigation loaded successfully');
            initNavigation();
        })
        .catch(error => console.error('Error loading navigation:', error));
}

function initNavigation() {
    checkAndUpdateUserStatus();
}

window.onload = function () {
    loadNavigation();
};
