import { useEffect, useState } from "react";
import profileService from "../../services/profileService";


const Profile = () => {
 

  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Load profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setProfileError("");

      const response = await profileService.getProfile();

      setProfile(response.profile);
      setName(response.profile.name);
    } catch (error) {
      setProfileError(
        error.response?.data?.message || "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setProfileMessage("");
      setProfileError("");

      const response = await profileService.updateProfile({
        name,
      });

      setProfile(response.profile);
      setName(response.profile.name);

      setProfileMessage(response.message);
    } catch (error) {
      setProfileError(
        error.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    try {
      setChangingPassword(true);

      const response = await profileService.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordMessage(response.message);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Page Header */}
      <div className="profile-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your account information and security.</p>
        </div>
      </div>

      {profileError && (
        <div className="profile-alert profile-alert-error">
          {profileError}
        </div>
      )}

      {/* Profile Overview */}
      <div className="profile-grid">
        <div className="profile-card profile-overview">
          <div className="profile-avatar">
            {profile?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <h2>{profile?.name}</h2>

          <p className="profile-email">
            {profile?.email}
          </p>

          <span className="profile-role">
            {profile?.role?.replaceAll("_", " ")}
          </span>

          <div className="profile-status">
            <span
              className={`status-dot ${
                profile?.isActive ? "active" : "inactive"
              }`}
            ></span>

            {profile?.isActive ? "Active Account" : "Inactive Account"}
          </div>
        </div>

        {/* Account Details */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Account Details</h2>
            <p>Your account information.</p>
          </div>

          <div className="profile-details">
            <div className="profile-detail-item">
              <span>Name</span>
              <strong>{profile?.name}</strong>
            </div>

            <div className="profile-detail-item">
              <span>Email</span>
              <strong>{profile?.email}</strong>
            </div>

            <div className="profile-detail-item">
              <span>Role</span>
              <strong>
                {profile?.role?.replaceAll("_", " ")}
              </strong>
            </div>

            <div className="profile-detail-item">
              <span>Account Status</span>
              <strong>
                {profile?.isActive ? "Active" : "Inactive"}
              </strong>
            </div>

            <div className="profile-detail-item">
              <span>Member Since</span>
              <strong>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "-"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Update Profile */}
      <div className="profile-card">
        <div className="profile-card-header">
          <h2>Update Profile</h2>
          <p>Update your personal information.</p>
        </div>

        <form
          className="profile-form"
          onSubmit={handleProfileSubmit}
        >
          <div className="form-group">
            <label htmlFor="profile-name">
              Full Name
            </label>

            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              minLength={2}
              maxLength={50}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              value={profile?.email || ""}
              disabled
            />

            <small>
              Email cannot be changed from profile settings.
            </small>
          </div>

          {profileMessage && (
            <div className="profile-alert profile-alert-success">
              {profileMessage}
            </div>
          )}

          <button
            type="submit"
            className="profile-primary-btn"
            disabled={savingProfile}
          >
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="profile-card">
        <div className="profile-card-header">
          <h2>Change Password</h2>
          <p>
            Keep your account secure by using a strong password.
          </p>
        </div>

        <form
          className="profile-form"
          onSubmit={handlePasswordSubmit}
        >
          {/* Current Password */}
          <div className="form-group">
            <label htmlFor="current-password">
              Current Password
            </label>

            <div className="password-input-wrapper">
              <input
                id="current-password"
                type={
                  showCurrentPassword ? "text" : "password"
                }
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                placeholder="Enter current password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowCurrentPassword(
                    !showCurrentPassword
                  )
                }
              >
                {showCurrentPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="new-password">
              New Password
            </label>

            <div className="password-input-wrapper">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter new password"
                minLength={6}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowNewPassword(!showNewPassword)
                }
              >
                {showNewPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirm-password">
              Confirm New Password
            </label>

            <div className="password-input-wrapper">
              <input
                id="confirm-password"
                type={
                  showConfirmPassword ? "text" : "password"
                }
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
                minLength={6}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {showConfirmPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {passwordError && (
            <div className="profile-alert profile-alert-error">
              {passwordError}
            </div>
          )}

          {passwordMessage && (
            <div className="profile-alert profile-alert-success">
              {passwordMessage}
            </div>
          )}

          <button
            type="submit"
            className="profile-primary-btn"
            disabled={changingPassword}
          >
            {changingPassword
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;