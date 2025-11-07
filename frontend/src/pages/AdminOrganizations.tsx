import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Building, 
  Mail, 
  Globe, 
  Calendar,
  CheckCircle,
  XCircle,
  Power
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Organization {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  website?: string;
  contactEmail: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
}

interface CreateOrganizationData {
  name: string;
  description: string;
  contactEmail: string;
  website: string;
  isActive: boolean;
}

interface EditOrganizationData extends CreateOrganizationData {
  _id: string;
}

interface OrganizationModalProps {
  organization?: EditOrganizationData;
  onSave: (data: CreateOrganizationData) => void;
  onClose: () => void;
}

interface OrganizationDetailsModalProps {
  organization: Organization;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onClose: () => void;
}

interface DeleteConfirmModalProps {
  organization: Organization;
  onConfirm: () => void;
  onClose: () => void;
}

const AdminOrganizations: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ current: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<EditOrganizationData | null>(null);
  const [viewingOrganization, setViewingOrganization] = useState<Organization | null>(null);
  const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: '10'
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await axios.get(`/admin/organizations?${params}`);
      setOrganizations(response.data.organizations);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchOrganizations();
  };

  const handleCreateOrganization = async (data: CreateOrganizationData) => {
    try {
      await axios.post('/admin/organizations', data);
      toast.success('Organization created successfully');
      setShowCreateModal(false);
      fetchOrganizations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    }
  };

  const handleUpdateOrganization = async (data: CreateOrganizationData) => {
    if (!editingOrganization) return;

    try {
      await axios.put(`/admin/organizations/${editingOrganization._id}`, data);
      toast.success('Organization updated successfully');
      setEditingOrganization(null);
      fetchOrganizations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update organization');
    }
  };

  const handleToggleStatus = async (organization: Organization) => {
    try {
      await axios.put(`/admin/organizations/${organization._id}/toggle-status`);
      toast.success(`Organization ${organization.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchOrganizations();
      setViewingOrganization(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update organization status');
    }
  };

  const handleDeleteOrganization = async (organization: Organization) => {
    try {
      await axios.delete(`/admin/organizations/${organization._id}`);
      toast.success('Organization deleted successfully');
      setDeletingOrganization(null);
      fetchOrganizations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete organization');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, current: newPage }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Management</h1>
          <p className="text-gray-600">Manage campus organizations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Organization
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  className="input pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary">Search</button>
            </div>
          </form>
          
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Organizations</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Loading organizations...
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No organizations found
                  </td>
                </tr>
              ) : (
                organizations.map((organization) => (
                  <tr key={organization._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Building className="w-5 h-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {organization.name}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {organization.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-1 text-gray-400" />
                        {organization.contactEmail}
                      </div>
                      {organization.website && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Globe className="w-4 h-4 mr-1 text-gray-400" />
                          <a 
                            href={organization.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-primary-600"
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        organization.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {organization.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(organization.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        by {organization.createdBy.firstName} {organization.createdBy.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewingOrganization(organization)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingOrganization({
                            _id: organization._id,
                            name: organization.name,
                            description: organization.description,
                            contactEmail: organization.contactEmail,
                            website: organization.website || '',
                            isActive: organization.isActive
                          })}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(organization)}
                          className={organization.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                          title={organization.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingOrganization(organization)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {organizations.length} of {pagination.total} organizations
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {pagination.current} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Organization Modal */}
      {(showCreateModal || editingOrganization) && (
        <OrganizationModal
          organization={editingOrganization || undefined}
          onSave={editingOrganization ? handleUpdateOrganization : handleCreateOrganization}
          onClose={() => {
            setShowCreateModal(false);
            setEditingOrganization(null);
          }}
        />
      )}

      {/* Organization Details Modal */}
      {viewingOrganization && (
        <OrganizationDetailsModal
          organization={viewingOrganization}
          onEdit={() => {
            setEditingOrganization({
              _id: viewingOrganization._id,
              name: viewingOrganization.name,
              description: viewingOrganization.description,
              contactEmail: viewingOrganization.contactEmail,
              website: viewingOrganization.website || '',
              isActive: viewingOrganization.isActive
            });
            setViewingOrganization(null);
          }}
          onToggleStatus={() => handleToggleStatus(viewingOrganization)}
          onDelete={() => {
            setDeletingOrganization(viewingOrganization);
            setViewingOrganization(null);
          }}
          onClose={() => setViewingOrganization(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingOrganization && (
        <DeleteConfirmModal
          organization={deletingOrganization}
          onConfirm={() => handleDeleteOrganization(deletingOrganization)}
          onClose={() => setDeletingOrganization(null)}
        />
      )}
    </div>
  );
};

// Create/Edit Organization Modal Component
const OrganizationModal: React.FC<OrganizationModalProps> = ({ organization, onSave, onClose }) => {
  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: organization?.name || '',
    description: organization?.description || '',
    contactEmail: organization?.contactEmail || '',
    website: organization?.website || '',
    isActive: organization?.isActive ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {organization ? 'Edit Organization' : 'Create Organization'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                required
                className="input w-full"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                className="input w-full"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email *
              </label>
              <input
                type="email"
                required
                className="input w-full"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                className="input w-full"
                placeholder="https://..."
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active organization
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : organization ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Organization Details Modal Component
const OrganizationDetailsModal: React.FC<OrganizationDetailsModalProps> = ({ 
  organization, 
  onEdit, 
  onToggleStatus, 
  onDelete, 
  onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Organization Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-16 h-16">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <Building className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900">{organization.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                  organization.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {organization.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                <p className="text-gray-900">{organization.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-900">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {organization.contactEmail}
                  </div>
                  {organization.website && (
                    <div className="flex items-center text-gray-900">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      <a 
                        href={organization.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary-600"
                      >
                        {organization.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Created</h4>
                <div className="flex items-center text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(organization.createdAt).toLocaleDateString()}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  by {organization.createdBy.firstName} {organization.createdBy.lastName}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Last Updated</h4>
                <div className="flex items-center text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(organization.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={onEdit}
                className="btn-secondary flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={onToggleStatus}
                className={`${organization.isActive 
                  ? 'btn-secondary text-red-600 hover:text-red-700' 
                  : 'btn-secondary text-green-600 hover:text-green-700'
                } flex items-center`}
              >
                <Power className="w-4 h-4 mr-2" />
                {organization.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={onDelete}
                className="btn-secondary text-red-600 hover:text-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ organization, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Organization</h3>
            </div>
          </div>
          
          <p className="text-gray-500 mb-6">
            Are you sure you want to delete <strong>{organization.name}</strong>? 
            This action cannot be undone and will also delete all associated events and remove users from this organization.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete Organization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrganizations;
