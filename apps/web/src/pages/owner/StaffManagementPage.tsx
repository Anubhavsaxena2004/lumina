import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { User } from '../../types';
import { formatDateTime } from '../../lib/formatters';
import { Users, UserPlus, Key, Ban, CheckCircle2, RefreshCw, AlertCircle, Phone, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusChip } from '../../components/ui/StatusChip';
import { Skeleton } from '../../components/ui/Skeleton';

export const StaffManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Staff Modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('+91');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Reset Password Modal
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const list = await api.users.getStaffList();
      setUsers(list);
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      setModalError('All fields are required.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      await api.users.createStaff({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        mobile_number: mobileNumber.trim(),
        password: password.trim(),
      });
      setIsAddStaffOpen(false);
      setName('');
      setUsername('');
      setPassword('');
      await fetchUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create staff account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDeactivate = async (u: User) => {
    try {
      await api.users.deactivateStaff(u.id);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPassword.trim()) return;

    setIsResetting(true);
    try {
      await api.users.resetPassword(resetTargetUser.id, newPassword.trim());
      setResetTargetUser(null);
      setNewPassword('');
      alert(`Password for @${resetTargetUser.username} successfully updated.`);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <Users className="h-6 w-6 text-[#9B1C31]" />
            Staff Accounts & Access Control
          </h1>
          <p className="text-xs text-[#66615C]">
            Manage individual staff accounts, role isolation, and security credentials (Argon2id)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchUsers}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddStaffOpen(true)}
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
          >
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="divide-y divide-[#F5EFE6]">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF6EF]/50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#2B2B2B]">{u.name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        u.role === 'OWNER'
                          ? 'bg-[#9B1C31] text-white'
                          : 'bg-[#B8893B] text-white'
                      }`}
                    >
                      {u.role}
                    </span>
                    <StatusChip status={u.isActive ? 'ACTIVE' : 'SOFT_DELETED'} />
                  </div>
                  <div className="text-xs text-[#66615C]">
                    Username: <span className="font-semibold text-[#2B2B2B]">@{u.username}</span>
                    {u.mobile_number && (
                      <span className="ml-3 text-[#8C857E]">Mobile: {u.mobile_number}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {u.role !== 'OWNER' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setResetTargetUser(u)}
                      leftIcon={<Key className="h-3.5 w-3.5" />}
                    >
                      Reset Password
                    </Button>
                    <Button
                      variant={u.isActive ? 'danger' : 'gold'}
                      size="sm"
                      onClick={() => handleToggleDeactivate(u)}
                      leftIcon={<Ban className="h-3.5 w-3.5" />}
                    >
                      {u.isActive ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8DFD5] space-y-4">
            <h3 className="text-base font-bold text-[#2B2B2B]">Create New Staff Account</h3>
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {modalError}
              </div>
            )}
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <Input
                label="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                autoFocus
              />
              <Input
                label="Username (Login Handle)"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="e.g. ramesh"
              />
              <Input
                label="Mobile Number (E.164)"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+919876543210"
                leftAddon={<Phone className="h-4 w-4" />}
              />
              <Input
                label="Initial Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                leftAddon={<Lock className="h-4 w-4" />}
              />
              <div className="flex justify-end gap-2.5 pt-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={isSubmitting}>
                  Create Staff Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8DFD5] space-y-4">
            <h3 className="text-base font-bold text-[#2B2B2B]">
              Reset Password for {resetTargetUser.name}
            </h3>
            <p className="text-xs text-[#66615C]">
              New password will be encrypted with Argon2id. The staff member will need this to sign in.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoFocus
              />
              <div className="flex justify-end gap-2.5 pt-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  disabled={isResetting}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={isResetting}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
