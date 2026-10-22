
import { useEffect, useMemo, useState  , type FormEvent } from 'react';
import './ContactsPage.css';
import { getContacts, updateContact, deleteContact } from '../../../services/contactsApi';

import { getMyAccount, getUser, updateUser, changePassword, type UserAccount } from '../../../services/authApi';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';

type Contact = {
  id: number;
  user_id: number | null;
  name: string;
  phone: string;
  email: string;
};

type ContactForm = Omit<Contact, 'id' | 'user_id'>;

const emptyForm: ContactForm = {
  name: '',
  phone: '',
  email: '',
};

function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [error, setError] = useState('');

  // const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [accountForm, setAccountForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [, setAccountError] = useState('');
  const [, setAccountMessage] = useState('');
  // const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [canChangePassword, setCanChangePassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [, setIsSidebarMenuOpen] = useState(false);
  const [isTopbarMenuOpen, setIsTopbarMenuOpen] = useState(false);
  // const profileMenuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    getMyAccount()
      .then((data) => {
        setCurrentUser(data);
      })
      .catch((error) => {
        console.error('دریافت اطلاعات حساب ناموفق بود:', error);
      });
    getContacts()
      .then((apiContacts) => {
        setContacts(
          apiContacts.map((contact) => ({
            id: contact.id,
            user_id: contact.user_id,
            name: `${contact.first_name} ${contact.last_name}`.trim(),
            phone: contact.phone,
            email: contact.email ?? '',
          })),
        );
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : 'دریافت مخاطبان ناموفق بود.',
        );
      });
  }, []);

  useEffect(() => {
    function handleOutsideClick() {
      setIsSidebarMenuOpen(false);
      setIsTopbarMenuOpen(false);
    }

    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fa');

    return contacts.filter((contact) =>
      contact.name.toLocaleLowerCase('fa').includes(query),
    );
  }, [contacts, search]);


// async function openAccountModal() {
//   setIsAccountModalOpen(true);
//   setAccountError('');
//   setAccountMessage('');
//   setIsAccountLoading(true);

//   try {
//     const data = await getMyAccount();

//     setAccount(data);
//     setAccountForm({
//       first_name: data.first_name,
//       last_name: data.last_name,
//       phone: data.phone,
//       email: data.email ?? '',
//     });
//   } catch (error) {
//     setAccountError(
//       error instanceof Error
//         ? error.message
//         : 'دریافت اطلاعات حساب ناموفق بود.',
//     );
//   } finally {
//     setIsAccountLoading(false);
//   }
// }


// async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
//   event.preventDefault();
//   setAccountError('');
//   setAccountMessage('');

//   if (!account) {
//     setAccountError('اطلاعات حساب بارگذاری نشده است.');
//     return;
//   }

//   if (
//     !accountForm.first_name.trim() ||
//     !accountForm.last_name.trim() ||
//     !accountForm.phone.trim()
//   ) {
//     setAccountError('نام، نام خانوادگی و شماره موبایل الزامی هستند.');
//     return;
//   }

//   setIsAccountLoading(true);

//   try {
//     const updated = await updateUser(account.id, {
//       first_name: accountForm.first_name.trim(),
//       last_name: accountForm.last_name.trim(),
//       phone: accountForm.phone.trim(),
//       email: accountForm.email.trim() || null,
//     });

//     setAccount(updated);
//     setAccountForm({
//       first_name: updated.first_name,
//       last_name: updated.last_name,
//       phone: updated.phone,
//       email: updated.email ?? '',
//     });
//     closeModal();
//   } catch (error) {
//     setAccountError(
//       error instanceof Error
//         ? error.message
//         : 'ذخیره اطلاعات حساب ناموفق بود.',
//     );
//   } finally {
//     setIsAccountLoading(false);
//   }
// }


async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setAccountError('');
  setAccountMessage('');

  if (newPassword.length < 12) {
    setAccountError('رمز عبور جدید باید حداقل ۱۲ کاراکتر باشد.');
    return;
  }

  if (newPassword !== confirmNewPassword) {
    setAccountError('رمز عبور جدید و تکرار آن یکسان نیستند.');
    return;
  }

  setIsPasswordLoading(true);

  try {
    const result = await changePassword(currentPassword, newPassword);

    setAccountMessage(result.message);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  } catch (error) {
    setAccountError(
      error instanceof Error
        ? error.message
        : 'تغییر رمز عبور ناموفق بود.',
    );
  } finally {
    setIsPasswordLoading(false);
  }
}



async function openEditModal(contact: Contact) {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    });

    setError('');
    setAccountError('');
    setAccountMessage('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setAccount(null);
    setIsModalOpen(true);

    try {
      const myAccount = await getMyAccount();
      setCanChangePassword(contact.user_id === myAccount.id);
      if (contact.user_id === myAccount.id) {
        setAccount(myAccount);
        setAccountForm({
          first_name: myAccount.first_name,
          last_name: myAccount.last_name,
          phone: myAccount.phone,
          email: myAccount.email ?? '',
        });
      } else if (contact.user_id !== null && myAccount.role === 'admin') {
        const data = await getUser(contact.user_id);

        setAccount(data);
        setAccountForm({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          email: data.email ?? '',
        });
      }
    } catch (error) {
      setAccountError(
        error instanceof Error
          ? error.message
          : 'دریافت اطلاعات حساب ناموفق بود.',
      );
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }


async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setError('');
  setAccountError('');

  const name = form.name.trim();
  const phone = form.phone.trim();
  const email = form.email.trim();

  if (!name || !phone || !email) {
    setError('لطفاً تمام فیلدها را تکمیل کنید.');
    return;
  }

  if (!/^[0-9۰-۹٠-٩+\-\s()]{7,20}$/.test(phone)) {
    setError('شماره تلفن واردشده معتبر نیست.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('فرمت ایمیل صحیح نیست.');
    return;
  }

  const nameParts = name.split(/\s+/);
  const first_name = nameParts[0];
  const last_name = nameParts.slice(1).join(' ');

  if (!last_name) {
    setError('لطفاً نام و نام خانوادگی را وارد کنید.');
    return;
  }

  if (account) {
    if (
      !accountForm.first_name.trim() ||
      !accountForm.last_name.trim() ||
      !accountForm.phone.trim()
    ) {
      setError('نام، نام خانوادگی و شماره موبایل حساب الزامی هستند.');
      return;
    }

    const accountEmail = accountForm.email.trim();

    if (
      accountEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)
    ) {
      setError('فرمت ایمیل حساب صحیح نیست.');
      return;
    }
  }

  if (editingId === null) {
    setError('مخاطبی برای ویرایش انتخاب نشده است.');
    return;
  }

  try {
    const updatedContact = await updateContact(editingId, {
      first_name,
      last_name,
      phone,
      email,
    });

    let updatedAccount: UserAccount | null = null;

    if (account) {
      updatedAccount = await updateUser(account.id, {
        first_name: accountForm.first_name.trim(),
        last_name: accountForm.last_name.trim(),
        phone: accountForm.phone.trim(),
        email: accountForm.email.trim() || null,
      });
    }

    setContacts((previous) =>
      previous.map((contact) =>
        contact.id === editingId
          ? {
              ...contact,
              id: updatedContact.id,
              name: `${updatedContact.first_name} ${updatedContact.last_name}`.trim(),
              phone: updatedContact.phone,
              email: updatedContact.email ?? '',
            }
          : contact,
      ),
    );

    if (updatedAccount) {
      setAccount(updatedAccount);
      setAccountForm({
        first_name: updatedAccount.first_name,
        last_name: updatedAccount.last_name,
        phone: updatedAccount.phone,
        email: updatedAccount.email ?? '',
      });
    }

    closeModal();
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'ذخیره تغییرات ناموفق بود.',
    );
  }
}


  async function handleDelete(contact: Contact) {
    const confirmed = window.confirm(
      `آیا از حذف مخاطب «${contact.name}» مطمئن هستید؟`,
    );

    if (!confirmed) return;

    try {
      await deleteContact(contact.id);

      setContacts((previous) =>
        previous.filter((item) => item.id !== contact.id),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'حذف مخاطب ناموفق بود.',
      );
    }
  }


  return (
    <div className="contacts-app" dir="rtl">
      <aside className="sidebar">
        <a className="brand" href="#contacts" aria-label="مدیریت مخاطبین">
          <span>مخاطبین</span>
        </a>

        <span className="nav-caption">مدیریت</span>

        <nav className="side-nav">
          <a className="nav-item active" href="#contacts">
            <span className="nav-icon" >
              <PeopleAltIcon />
            </span>
            <span>مخاطبین</span>
            <span className="nav-count">{contacts.length}</span>
          </a>

        </nav>


          

          <div className="sidebar-bottom">
            <div className="profile-avatar">
              {currentUser?.first_name?.trim()?.charAt(0) || 'م'}
            </div>

            <div className="profile-info">
              <strong>
                {currentUser
                  ? `${currentUser.first_name ?? ''} ${currentUser.last_name ?? ''}`.trim() || 'مدیر سامانه'
                  : 'مدیر سامانه'}
              </strong>
            </div>

            <div className="profile-menu-container">
              {/* <button
                type="button"
                className="profile-menu"
                aria-label="منوی حساب کاربری"
                aria-expanded={isSidebarMenuOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsSidebarMenuOpen((prev) => !prev);
                }}
              >
                ···
              </button> */}

              {/* {isSidebarMenuOpen && (
                <div
                  className="profile-dropdown"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() => {
                      setIsSidebarMenuOpen(false);
                      setIsTopbarMenuOpen(false);
                      window.location.href = '/login';
                    }}
                  >
                    <span>خروج از حساب کاربری</span>
                  </button>
                </div>
              )} */}
            </div>
          </div>

      </aside>

      <main className="contacts-main" id="contacts">
        <header className="topbar">
          <div className="breadcrumb">
            <span>مدیریت</span>
            <span className="breadcrumb-separator">/</span>
            <strong>مخاطبین</strong>
          </div>
          <div className="topbar-profile-container">
            <button
              className="topbar-profile"
              type="button"
              aria-label="پروفایل کاربر"
              aria-expanded={isTopbarMenuOpen}
              onClick={(event) => {
                event.stopPropagation();
                setIsTopbarMenuOpen((prev) => !prev);
              }}
            >
              {currentUser?.first_name?.trim()?.charAt(0) || 'م'}
            </button>

            {isTopbarMenuOpen && (
              <div
                className="profile-dropdown topbar-dropdown"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => {
                    setIsSidebarMenuOpen(false);
                    setIsTopbarMenuOpen(false);
                    window.location.href = '/login';
                  }}
                >
                  خروج از حساب کاربری
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="page-content">
            <section className="page-heading">
              <div>
                <h1>مخاطبین</h1>
              </div>
            </section>

 

          <section className="contacts-panel">
            <div className='title-panel'>

                <div className="panel-heading">
                  <span className="result-badge">
                      {filteredContacts.length.toLocaleString('fa-IR')} مخاطب
                  </span>
                </div>

                <div className="toolbar">
                <label className="search-box">
                    <span className="search-icon" aria-hidden="true">⌕</span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="جست‌وجو بر اساس نام..."
                      aria-label="جست‌وجوی مخاطب بر اساس نام"
                    />
                    {search && (
                    <button
                        className="clear-search"
                        type="button"
                        onClick={() => setSearch('')}
                        aria-label="پاک کردن جست‌وجو"
                    >
                        <CloseIcon sx={{ fontSize: 20, color: '#c62828' }} />
                    </button>
                    )}
                </label>
              </div>
            </div>

            <div className="desktop-table">
              <table>
                <thead>
                  <tr>
                    <th><strong> نام مخاطب </strong></th>
                    <th><strong>شماره تلفن</strong></th>
                    <th><strong>ایمیل</strong></th>
                    <th><strong>عملیات</strong></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id}>
                      <td>
                        <div className="contact-name-cell">
                            <strong>{contact.name}</strong>
                        </div>
                      </td>
                      <td dir="ltr" className="phone-cell">{contact.phone}</td>
                      <td dir="ltr" className="email-cell">{contact.email}</td>
                        <td>
                            <div className="row-actions">
                            <button
                                type="button"
                                className="icon-button edit-action"
                                onClick={() => openEditModal(contact)}
                                aria-label={`ویرایش ${contact.name}`}
                                title="ویرایش"
                            >
                                <EditIcon sx={{ fontSize: 18, color: '#607d8b' }} />
                            </button>
                            <button
                                type="button"
                                className="icon-button delete-action"
                                onClick={() => handleDelete(contact)}
                                aria-label={`حذف ${contact.name}`}
                                title="حذف"
                            >
                                  <CloseIcon sx={{ fontSize: 20, color: '#c62828' }} />

                            </button>
                            </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredContacts.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">⌕</span>
                  <strong>مخاطبی پیدا نشد</strong>
                  <p>عبارت جست‌وجو را تغییر بده یا مخاطب جدیدی ثبت کن.</p>
                </div>
              )}
            </div>

            <div className="mobile-contact-list">
              {filteredContacts.map((contact) => (
                <article className="mobile-contact-card" key={contact.id}>
                  <div className="mobile-contact-top">
                    <div className="contact-name-cell">
                      <span className="contact-avatar">
                        {contact.name.charAt(0)}
                      </span>
                      <div className="mobile-contact-name">
                        <strong>{contact.name}</strong>
                        <span>مخاطب</span>
                      </div>
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-button edit-action"
                        onClick={() => openEditModal(contact)}
                        aria-label={`ویرایش ${contact.name}`}
                      >
                        <EditIcon sx={{ fontSize: 18, color: '#607d8b' }} />
                      </button>
                      <button
                        type="button"
                        className="icon-button delete-action"
                        onClick={() => handleDelete(contact)}
                        aria-label={`حذف ${contact.name}`}
                      >
                        <CloseIcon sx={{ fontSize: 20, color: '#c62828' }} />
                      </button>
                    </div>
                  </div>
                  <div className="mobile-contact-detail">
                    <span>تلفن</span>
                    <b dir="ltr">{contact.phone}</b>
                  </div>
                  <div className="mobile-contact-detail">
                    <span>ایمیل</span>
                    <b dir="ltr">{contact.email}</b>
                  </div>
                </article>
              ))}

              {filteredContacts.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">⌕</span>
                  <strong>مخاطبی پیدا نشد</strong>
                  <p>عبارت جست‌وجو را تغییر بده یا مخاطب جدیدی ثبت کن.</p>
                </div>
              )}
            </div>

            {/* <div className="panel-footer">
              <span>
                نمایش {filteredContacts.length.toLocaleString('fa-IR')} از{' '}
                {contacts.length.toLocaleString('fa-IR')} مخاطب
              </span>
              <span className="footer-status">
                <span className="status-dot" />
                اطلاعات آزمایشی
              </span>
            </div> */}
          </section>
        </div>
      </main>


      {isModalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="contact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
          >
            <div className="modal-heading">
              <div>
                <h2 id="contact-modal-title">
                  ویرایش مخاطب و حساب کاربری
                </h2>
                <p>اطلاعات مخاطب و حساب کاربری مرتبط را ویرایش کنید.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                aria-label="بستن فرم"
              >
                <CloseIcon sx={{ fontSize: 16, color: '#c62828' , textAlign:"center" ,}} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="contact-form">
              <label>
                نام و نام خانوادگی
                <input
                  autoFocus
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="مثلاً علی رضایی"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                شماره تلفن
                <input
                  type="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  placeholder="09121234567"
                  maxLength={20}
                  required
                />
              </label>

              <label>
                آدرس ایمیل
                <input
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="name@example.com"
                  maxLength={254}
                  required
                />
              </label>
              {account && (
                <div className="account-edit-section">
                  <h3>اطلاعات حساب کاربری</h3>

                  <label>
                    نام
                    <input
                      value={accountForm.first_name}
                      onChange={(event) =>
                        setAccountForm({
                          ...accountForm,
                          first_name: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    نام خانوادگی
                    <input
                      value={accountForm.last_name}
                      onChange={(event) =>
                        setAccountForm({
                          ...accountForm,
                          last_name: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    تلفن حساب
                    <input
                      type="tel"
                      dir="ltr"
                      value={accountForm.phone}
                      onChange={(event) =>
                        setAccountForm({
                          ...accountForm,
                          phone: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    ایمیل حساب
                    <input
                      type="email"
                      dir="ltr"
                      value={accountForm.email}
                      onChange={(event) =>
                        setAccountForm({
                          ...accountForm,
                          email: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              )}
              {account && canChangePassword && (
                <div className="account-edit-section">
                  <h3>تغییر رمز عبور حساب خودم</h3>

                  <label>
                    رمز عبور فعلی
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      autoComplete="current-password"
                    />
                  </label>

                  <label>
                    رمز عبور جدید
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={12}
                    />
                  </label>

                  <label>
                    تکرار رمز عبور جدید
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(event) => setConfirmNewPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={12}
                    />
                  </label>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      handlePasswordSubmit({
                        preventDefault: () => {},
                      } as FormEvent<HTMLFormElement>)
                    }
                    disabled={isPasswordLoading}
                  >
                    {isPasswordLoading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
                  </button>
                </div>
              )}
              {error && <p className="form-error" role="alert">{error}</p>}

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeModal}>
                  انصراف
                </button>
                <button type="submit" className="primary-button">
                  ثبت مخاطب
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

 
    </div>
  );
}

export default ContactsPage;
