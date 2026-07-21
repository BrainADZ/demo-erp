import { Space, Layout, Divider, Typography } from 'antd';
import logo from '@/style/images/logo.png';
import useLanguage from '@/locale/useLanguage';
import { useSelector } from 'react-redux';
import { FILE_BASE_URL } from '@/config/serverApiConfig';
import { selectCompanySettings } from '@/redux/settings/selectors';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function SideContent() {
  const translate = useLanguage();
  const companySettings = useSelector(selectCompanySettings);
  const logoSrc = companySettings?.company_logo ? FILE_BASE_URL + companySettings.company_logo : logo;

  return (
    <Content
      style={{
        padding: '150px 30px 30px',
        width: '100%',
        maxWidth: '450px',
        margin: '0 auto',
      }}
      className="sideContent"
    >
      <div style={{ width: '100%' }}>
        <img
          src={logoSrc}
          alt="RexGalaxy ERP CRM"
          style={{ margin: '0 0 40px', display: 'block' }}
          height={120}
          width={260}
        />

        <Title level={1} style={{ fontSize: 28 }}>
          Brainadz ERP 
        </Title>
        <Text>
          Accounting / Invoicing / Quote App <b />
        </Text>

        <div className="space20"></div>
      </div>
    </Content>
  );
}
