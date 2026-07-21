import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Layout, Menu } from 'antd';
import { useSelector } from 'react-redux';

import { useAppContext } from '@/context/appContext';

import useLanguage from '@/locale/useLanguage';
import logoIcon from '@/style/images/logo.png';
import logoText from '@/style/images/logo-text.svg';
import { FILE_BASE_URL } from '@/config/serverApiConfig';
import { selectCompanySettings } from '@/redux/settings/selectors';
import { selectCurrentAdmin } from '@/redux/auth/selectors';

import useResponsive from '@/hooks/useResponsive';

import {
  SettingOutlined,
  CustomerServiceOutlined,
  ContainerOutlined,
  FileSyncOutlined,
  DashboardOutlined,
  TagOutlined,
  TagsOutlined,
  UserOutlined,
  CreditCardOutlined,
  MenuOutlined,
  FileOutlined,
  ShopOutlined,
  FilterOutlined,
  WalletOutlined,
  ReconciliationOutlined,
  TeamOutlined,
  CalendarOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Navigation() {
  const { isMobile } = useResponsive();

  return isMobile ? <MobileSidebar /> : <Sidebar collapsible={false} />;
}

function Sidebar({ collapsible, isMobile = false }) {
  let location = useLocation();

  const { state: stateApp, appContextAction } = useAppContext();
  const { isNavMenuClose } = stateApp;
  const { navMenu } = appContextAction;
  const [showLogoApp, setLogoApp] = useState(isNavMenuClose);
  const [currentPath, setCurrentPath] = useState(location.pathname.slice(1));
  const companySettings = useSelector(selectCompanySettings);
  const currentAdmin = useSelector(selectCurrentAdmin);

  const translate = useLanguage();
  const navigate = useNavigate();
  const companyLogoSrc = companySettings?.company_logo
    ? FILE_BASE_URL + companySettings.company_logo
    : logoIcon;
  const allowedModules = currentAdmin?.permissionModules || [];
  const canAccessModule = (moduleKey) =>
    allowedModules.length === 0 || allowedModules.includes(moduleKey);

  const items = [
    canAccessModule('dashboard')
      ? {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: <Link to={'/'}>{translate('dashboard')}</Link>,
        }
      : null,
    canAccessModule('customers')
      ? {
          key: 'customer',
          icon: <CustomerServiceOutlined />,
          label: <Link to={'/customer'}>{translate('customers')}</Link>,
        }
      : null,
    canAccessModule('invoices')
      ? {
          key: 'invoice',
          icon: <ContainerOutlined />,
          label: <Link to={'/invoice'}>{translate('invoices')}</Link>,
        }
      : null,
    canAccessModule('quotes')
      ? {
          key: 'quote',
          icon: <FileSyncOutlined />,
          label: <Link to={'/quote'}>{translate('quote')}</Link>,
        }
      : null,
    canAccessModule('payments')
      ? {
          key: 'payment',
          icon: <CreditCardOutlined />,
          label: <Link to={'/payment'}>{translate('payments')}</Link>,
        }
      : null,
    canAccessModule('attendance')
      ? {
          key: 'attendance',
          icon: <CalendarOutlined />,
          label: <Link to={'/attendance'}>{translate('attendance')}</Link>,
        }
      : null,
    canAccessModule('paymentModes')
      ? {
          key: 'paymentMode',
          label: <Link to={'/payment/mode'}>{translate('payments_mode')}</Link>,
          icon: <WalletOutlined />,
        }
      : null,
    canAccessModule('employees')
      ? {
          key: 'employees',
          label: <Link to={'/employees'}>{translate('employees')}</Link>,
          icon: <TeamOutlined />,
        }
      : null,
    canAccessModule('taxes')
      ? {
          key: 'taxes',
          label: <Link to={'/taxes'}>{translate('taxes')}</Link>,
          icon: <ShopOutlined />,
        }
      : null,
    canAccessModule('enquiries')
      ? {
          key: 'enquiry',
          icon: <ContainerOutlined />,
          label: <Link to={'/enquiry'}>Enquiries</Link>,
        }
      : null,
    canAccessModule('settings')
      ? {
          key: 'generalSettings',
          label: <Link to={'/settings'}>{translate('settings')}</Link>,
          icon: <SettingOutlined />,
        }
      : null,
    canAccessModule('about')
      ? {
          key: 'about',
          label: <Link to={'/about'}>{translate('about')}</Link>,
          icon: <ReconciliationOutlined />,
        }
      : null,
  ].filter(Boolean);

  useEffect(() => {
    if (location)
      if (currentPath !== location.pathname) {
        if (location.pathname === '/') {
          setCurrentPath('dashboard');
        } else setCurrentPath(location.pathname.slice(1));
      }
  }, [location, currentPath]);

  useEffect(() => {
    if (isNavMenuClose) {
      setLogoApp(isNavMenuClose);
    }
    const timer = setTimeout(() => {
      if (!isNavMenuClose) {
        setLogoApp(isNavMenuClose);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isNavMenuClose]);
  const onCollapse = () => {
    navMenu.collapse();
  };

  return (
    <Sider
      collapsible={collapsible}
      collapsed={collapsible ? isNavMenuClose : collapsible}
      onCollapse={onCollapse}
      className="navigation"
      width={256}
      style={{
        overflow: 'auto',
        height: '100vh',

        position: isMobile ? 'absolute' : 'relative',
        bottom: '20px',
        ...(!isMobile && {
          // border: 'none',
          ['left']: '20px',
          top: '20px',
          // borderRadius: '8px',
        }),
      }}
      theme={'light'}
    >
      <div
        className="logo"
        onClick={() => navigate('/')}
        style={{
          cursor: 'pointer',
        }}
      >
        <img src={companyLogoSrc} alt="Logo" style={{ maxHeight: '80px', maxWidth: '220px' }} />

        {/* {!showLogoApp && (
          <img
            src={logoText}
            alt="Logo"
            style={{
              marginTop: '3px',
              marginLeft: '10px',
              height: '38px',
            }}
          />
        )} */}
      </div>
      <Menu
        items={items}
        mode="inline"
        theme={'light'}
        selectedKeys={[currentPath]}
        style={{
          width: 256,
        }}
      />
    </Sider>
  );
}

function MobileSidebar() {
  const [visible, setVisible] = useState(false);
  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };

  return (
    <>
      <Button
        type="text"
        size="large"
        onClick={showDrawer}
        className="mobile-sidebar-btn"
        style={{ ['marginLeft']: 25 }}
      >
        <MenuOutlined style={{ fontSize: 18 }} />
      </Button>
      <Drawer
        width={250}
        // style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}
        placement={'left'}
        closable={false}
        onClose={onClose}
        open={visible}
      >
        <Sidebar collapsible={false} isMobile={true} />
      </Drawer>
    </>
  );
}
