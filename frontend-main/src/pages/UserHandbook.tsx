import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Edit2, Trash2, X, Activity, LogOut } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { Dropdown } from '../components/Dropdown';
import type { DropdownOption } from '../components/Dropdown';
import ConfirmationModal from '../components/ConfirmationModal';
import styles from '../styles/UserHandbook.module.css';

type UserRole = 'ADMIN' | 'VET' | 'USER';
type UserStatus = 'ACTIVE' | 'INACTIVE';

type User = {
  id: string;
  email: string;
  iin: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
};

type UserActivity = {
  id: string;
  userId: string;
  eventType: string;
  createdAt: string;
  eventInfo: {
    petId?: string;
    healthRecordId?: string;
  };
};

type PaginatedResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

type UserLogsResponse = {
  items: UserActivity[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

const roleNames: Record<UserRole, string> = {
  ADMIN: 'Администратор',
  VET: 'Ветеринар',
  USER: 'Владелец питомца',
};

const roleOptions: DropdownOption[] = [
  { value: 'USER', label: 'Владелец питомца' },
  { value: 'VET', label: 'Ветеринар' },
  { value: 'ADMIN', label: 'Администратор' },
];

const filterOptions: DropdownOption[] = [
  { value: 'all', label: 'Все' },
  ...roleOptions,
];

const eventTypeNames: Record<string, string> = {
  HEALTH_RECORD_CREATED: 'Создание записи о здоровье',
  HEALTH_RECORD_UPDATED: 'Обновление записи о здоровье',
  HEALTH_RECORD_DELETED: 'Удаление записи о здоровье',
  PET_CREATED: 'Создание питомца',
  PET_UPDATED: 'Обновление питомца',
  PET_DELETED: 'Удаление питомца',
  USER_LOGIN: 'Вход в систему',
  USER_LOGOUT: 'Выход из системы',
};

const formatFullName = (user: User): string => `${user.firstName} ${user.lastName}`;

export const UserHandbook = () => {
  const { logout, user } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  const [successName, setSuccessName] = useState('');
  const [successRole, setSuccessRole] = useState('');

  const fetchUsers = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<PaginatedResponse<User>>('/api/v1/account/admin/users');
      setUsers(response.content);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUserActivity = async (userId: string): Promise<void> => {
    setIsLoadingActivities(true);
    try {
      const response = await apiClient.get<UserLogsResponse>(
        `/api/v1/account/admin/users/${userId}/logs`
      );
      setUserActivities(response.items);
    } catch (err: any) {
      console.error('Error fetching user activity:', err);
      setUserActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleChangeRole = async (): Promise<void> => {
    if (!selectedUser) return;
    try {
      const updated = await apiClient.patch<User>(
        `/api/v1/account/admin/users/${selectedUser.id}/role`,
        { role: selectedRole }
      );
      setUsers(users.map(u => u.id === updated.id ? updated : u));
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setSuccessName(formatFullName(updated));
      setSuccessRole(roleNames[updated.role]);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Не удалось изменить роль');
      console.error('Error changing role:', err);
    }
  };

  const handleDeleteUser = async (): Promise<void> => {
    if (!selectedUser) return;
    try {
      await apiClient.delete(`/api/v1/account/admin/users/${selectedUser.id}`);
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      alert(err.message || 'Не удалось удалить пользователя');
      console.error('Error deleting user:', err);
    }
  };

  const handleViewActivity = async (user: User): Promise<void> => {
    setSelectedUser(user);
    setIsActivityModalOpen(true);
    await fetchUserActivity(user.id);
  };

  const openEditModal = (user: User): void => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User): void => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const closeEditModal = (): void => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const closeDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const closeActivityModal = (): void => {
    setIsActivityModalOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || (
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.iin.includes(searchQuery)
    );
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    vets: users.filter(u => u.role === 'VET').length,
    users: users.filter(u => u.role === 'USER').length,
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.topbar}>
        <span className={styles.topbarTitle}>Панель администратора</span>
        <div className={styles.topbarUser}>
          <span>{user?.firstName} {user?.lastName}</span>
          <button onClick={logout} className={styles.logoutBtn}>
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Всего</div>
            <div className={styles.statValue}>{stats.total}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Администраторы</div>
            <div className={styles.statValue}>{stats.admins}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Ветеринары</div>
            <div className={styles.statValue}>{stats.vets}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Владельцы</div>
            <div className={styles.statValue}>{stats.users}</div>
          </div>
        </div>

        <div className={styles.filtersRow}>
          <div className={styles.searchWrapper}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Поиск по имени, email или ИИН"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Роль:</label>
            <Dropdown
              options={filterOptions}
              value={roleFilter}
              onChange={(val) => setRoleFilter(val as UserRole | 'all')}
              className={styles.filterDropdown}
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className={styles.empty}>Пользователи не найдены</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>ФИО</th>
                  <th>ИИН</th>
                  <th>Роль</th>
                  <th>Дата регистрации</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{formatFullName(user)}</td>
                    <td>{user.iin}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[user.role.toLowerCase()]}`}>
                        {roleNames[user.role]}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => openEditModal(user)}
                          title="Изменить роль"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleViewActivity(user)}
                          title="История активности"
                        >
                          <Activity size={16} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.deleteAction}`}
                          onClick={() => openDeleteModal(user)}
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isEditModalOpen && selectedUser && (
          <div className={styles.modalOverlay} onClick={closeEditModal}>
            <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Изменить роль</h2>
                <button onClick={closeEditModal} className={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.modalUserName}>
                  Пользователь: <strong>{formatFullName(selectedUser)}</strong>
                </p>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Роль</label>
                  <Dropdown
                    options={roleOptions}
                    value={selectedRole}
                    onChange={(val) => setSelectedRole(val as UserRole)}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button onClick={closeEditModal} className={styles.cancelBtn}>
                  Отмена
                </button>
                <button onClick={handleChangeRole} className={styles.submitBtn}>
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          title="Удалить пользователя?"
          message="Вы уверены, что хотите удалить пользователя "
          highlightPrimary={selectedUser ? formatFullName(selectedUser) : ''}
          suffix="? Это действие нельзя отменить."
          confirmText="Удалить"
          cancelText="Отмена"
          onConfirm={handleDeleteUser}
          onCancel={closeDeleteModal}
        />

        <ConfirmationModal
          isOpen={isSuccessModalOpen}
          title="Роль изменена"
          message="Роль пользователя "
          highlightPrimary={successName}
          suffix=" успешно изменена на "
          highlightSecondary={`«${successRole}»`}
          confirmText="Закрыть"
          cancelText=""
          onConfirm={() => setIsSuccessModalOpen(false)}
          onCancel={() => setIsSuccessModalOpen(false)}
        />

        {isActivityModalOpen && selectedUser && (
          <div className={styles.modalOverlay} onClick={closeActivityModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>История активности</h2>
                <button onClick={closeActivityModal} className={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.modalUserName}>
                  Пользователь: <strong>{formatFullName(selectedUser)}</strong> ({selectedUser.email})
                </p>
                {isLoadingActivities ? (
                  <p className={styles.emptyActivity}>Загрузка...</p>
                ) : userActivities.length === 0 ? (
                  <p className={styles.emptyActivity}>Нет записей об активности</p>
                ) : (
                  <div className={styles.activityList}>
                    {userActivities.map((activity) => (
                      <div key={activity.id} className={styles.activityItem}>
                        <div className={styles.activityHeader}>
                          <span className={styles.activityAction}>
                            {eventTypeNames[activity.eventType] || activity.eventType}
                          </span>
                          <span className={styles.activityTime}>
                            {new Date(activity.createdAt).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        {activity.eventInfo && (
                          <p className={styles.activityDescription}>
                            {activity.eventInfo.petId && `ID питомца: ${activity.eventInfo.petId}`}
                            {activity.eventInfo.healthRecordId && ` | ID записи: ${activity.eventInfo.healthRecordId}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button onClick={closeActivityModal} className={styles.cancelBtn}>
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};