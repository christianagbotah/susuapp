'use client';

import { useState, useMemo } from 'react';
import { useAdminStore } from '@/store/app-store';
import { formatDate, getStatusColor, getInitials, formatCompactNumber } from '@/lib/formatters';
import { kycStatusData } from '@/lib/mock-data';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ShieldCheck, ShieldAlert, ShieldX, Search, Filter,
  Eye, Pencil, Ban, CheckCircle2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

const ITEMS_PER_PAGE = 8;

const roleColors: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  agent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  treasurer: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const kycBadge: Record<string, { label: string; cls: string }> = {
  full: { label: 'Full KYC', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  basic: { label: 'Basic', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  none: { label: 'No KYC', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export function AdminUsers() {
  const { allUsers } = useAdminStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<typeof allUsers[0] | null>(null);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editUser, setEditUser] = useState<typeof allUsers[0] | null>(null);
  const [newRole, setNewRole] = useState('');
  const [suspendedUsers, setSuspendedUsers] = useState<Set<string>>(new Set());

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchKyc = kycFilter === 'all' || u.kycLevel === kycFilter;
      return matchSearch && matchRole && matchKyc;
    });
  }, [allUsers, search, roleFilter, kycFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const fullKyc = allUsers.filter(u => u.kycLevel === 'full').length;
  const basicKyc = allUsers.filter(u => u.kycLevel === 'basic').length;
  const noKyc = allUsers.filter(u => u.kycLevel === 'none').length;

  const handleEditRole = () => {
    if (editUser && newRole) {
      toast.success(`Role updated to ${newRole} for ${editUser.name}`);
      setEditRoleOpen(false);
      setEditUser(null);
      setNewRole('');
    }
  };

  const handleToggleSuspend = (user: typeof allUsers[0]) => {
    setSuspendedUsers(prev => {
      const next = new Set(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
        toast.success(`${user.name} has been activated`);
      } else {
        next.add(user.id);
        toast.warning(`${user.name} has been suspended`);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Users', value: allUsers.length, icon: Users, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Full KYC', value: fullKyc, icon: ShieldCheck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Basic KYC', value: basicKyc, icon: ShieldAlert, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'No KYC', value: noKyc, icon: ShieldX, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* KYC Pie Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">KYC Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kycStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="count" nameKey="status">
                    {kycStatusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name, email, or phone..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="treasurer">Treasurer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={kycFilter} onValueChange={v => { setKycFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="KYC Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC</SelectItem>
                  <SelectItem value="full">Full KYC</SelectItem>
                  <SelectItem value="basic">Basic KYC</SelectItem>
                  <SelectItem value="none">No KYC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users Table (Desktop) */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">User</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">KYC</th>
                    <th className="px-4 py-3 text-left font-medium">Branch</th>
                    <th className="px-4 py-3 text-left font-medium">Joined</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(user => {
                    const suspended = suspendedUsers.has(user.id);
                    return (
                      <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              {suspended && <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 mt-0.5">Suspended</Badge>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.phone}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role]}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={`text-xs ${kycBadge[user.kycLevel].cls}`}>
                            {kycBadge[user.kycLevel].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.branch || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(user.memberSince)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedUser(user)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditUser(user); setNewRole(user.role); setEditRoleOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleToggleSuspend(user)}>
                              {suspended ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Ban className="h-3.5 w-3.5 text-orange-500" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {paginatedUsers.map(user => {
                const suspended = suspendedUsers.has(user.id);
                return (
                  <div key={user.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email} &middot; {user.phone}</p>
                      </div>
                      {suspended && <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 shrink-0">Suspended</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role]}`}>{user.role}</span>
                      <Badge variant="secondary" className={`text-xs ${kycBadge[user.kycLevel].cls}`}>{kycBadge[user.kycLevel].label}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(user.memberSince)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedUser(user)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => { setEditUser(user); setNewRole(user.role); setEditRoleOpen(true); }}><Pencil className="mr-1 h-3 w-3" /> Role</Button>
                      <Button size="sm" variant="outline" className={`text-xs ${suspended ? 'text-emerald-600' : 'text-orange-500'}`} onClick={() => handleToggleSuspend(user)}>
                        {suspended ? <><CheckCircle2 className="mr-1 h-3 w-3" /> Activate</> : <><Ban className="mr-1 h-3 w-3" /> Suspend</>}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="icon" className="h-7 w-7 text-xs" onClick={() => setPage(i + 1)}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>Full user details</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{selectedUser.name}</p>
                  <Badge variant="secondary" className={`mt-1 ${roleColors[selectedUser.role]}`}>{selectedUser.role}</Badge>
                </div>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selectedUser.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{selectedUser.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">KYC Level</span><Badge variant="secondary" className={`text-xs ${kycBadge[selectedUser.kycLevel].cls}`}>{kycBadge[selectedUser.kycLevel].label}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span>{selectedUser.branch || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{selectedUser.location || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Member Since</span><span>{formatDate(selectedUser.memberSince)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Agent Code</span><span>{selectedUser.agentCode || '—'}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onOpenChange={() => setEditRoleOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>Change the role for {editUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="treasurer">Treasurer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRoleOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleEditRole}>Save</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
