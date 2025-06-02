import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Shield, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Key, 
  Calendar,
  Mail,
  UserCog,
  UserPlus,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isAdmin: false,
    isVerified: true
  });

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: !!(user as any)?.isAdmin,
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    },
  });

  // Toggle verification mutation
  const toggleVerificationMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      return await apiRequest('PATCH', `/api/admin/users/${userId}/verification`, { isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      return await apiRequest('PATCH', `/api/admin/users/${userId}/password`, { password });
    },
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedUser(null);
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      return await apiRequest('POST', '/api/admin/users', userData);
    },
    onSuccess: () => {
      // Force refresh the users list immediately
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/users'] });
      setIsCreateUserDialogOpen(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        isAdmin: false,
        isVerified: true
      });
    },
  });

  // Debug: Check admin status
  console.log('User data:', user);
  console.log('Is admin?', (user as any)?.isAdmin);
  
  // Temporary fix: Grant admin access to the super admin account
  const isAdminUser = user && (
    (user as any).email === 'admin@survetic.com' || 
    (user as any)?.isAdmin === true
  );
  
  if (!user || !isAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                You don't have admin privileges to access this panel.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div className="flex items-start gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover-lift transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <UserCog className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Survetic Admin Panel
                </h1>
              </div>
              <p className="text-gray-600">Manage users, verification status, and platform access</p>
            </div>
          </div>
          
          <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white shadow-lg">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Enter password"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAdmin"
                    checked={newUser.isAdmin}
                    onCheckedChange={(checked) => setNewUser({...newUser, isAdmin: !!checked})}
                  />
                  <Label htmlFor="isAdmin">Admin User</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVerified"
                    checked={newUser.isVerified}
                    onCheckedChange={(checked) => setNewUser({...newUser, isVerified: !!checked})}
                  />
                  <Label htmlFor="isVerified">Email Verified</Label>
                </div>
                <Button 
                  onClick={() => createUserMutation.mutate(newUser)}
                  disabled={createUserMutation.isPending || !newUser.email || !newUser.password}
                  className="w-full"
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{(users as User[]).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(users as User[]).filter((u: User) => u.isVerified).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Shield className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Admin Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(users as User[]).filter((u: User) => u.isAdmin).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {(users as User[]).map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                          {user.isVerified ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Verified</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Unverified</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isAdmin ? 'destructive' : 'outline'}>
                          {user.isAdmin ? (
                            <><Shield className="h-3 w-3 mr-1" /> Admin</>
                          ) : (
                            'User'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => 
                              toggleVerificationMutation.mutate({
                                userId: user.id,
                                isVerified: !user.isVerified
                              })
                            }
                            disabled={toggleVerificationMutation.isPending}
                          >
                            {user.isVerified ? (
                              <XCircle className="h-4 w-4 mr-1" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            {user.isVerified ? 'Unverify' : 'Verify'}
                          </Button>

                          <Dialog open={isPasswordDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsPasswordDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Key className="h-4 w-4 mr-1" />
                                Reset Password
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reset Password for {user.firstName} {user.lastName}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="password">New Password</Label>
                                  <Input
                                    id="password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 characters)"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => {
                                      if (newPassword.length >= 6) {
                                        updatePasswordMutation.mutate({
                                          userId: user.id,
                                          password: newPassword
                                        });
                                      }
                                    }}
                                    disabled={newPassword.length < 6 || updatePasswordMutation.isPending}
                                    className="flex-1"
                                  >
                                    {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsPasswordDialogOpen(false);
                                      setNewPassword('');
                                      setSelectedUser(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {!user.isAdmin && (
                            <Dialog open={isDeleteDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsDeleteDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete User Account</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Alert variant="destructive">
                                    <AlertDescription>
                                      Are you sure you want to delete {user.firstName} {user.lastName}'s account? 
                                      This action cannot be undone and will remove all their surveys and responses.
                                    </AlertDescription>
                                  </Alert>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="destructive"
                                      onClick={() => deleteUserMutation.mutate(user.id)}
                                      disabled={deleteUserMutation.isPending}
                                      className="flex-1"
                                    >
                                      {deleteUserMutation.isPending ? 'Deleting...' : 'Delete Account'}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setIsDeleteDialogOpen(false);
                                        setSelectedUser(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}