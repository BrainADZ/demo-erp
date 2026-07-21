import { Button, Result } from 'antd';

import useLanguage from '@/locale/useLanguage';

const About = () => {
  const translate = useLanguage();
  return (
    <Result
      status="info"
      title={'BrainADZ Marketing ERP CRM'}
      subTitle={translate('Do you need help on customize of this app')}
      extra={
        <>
          <p>
            Website : <a href="https://www.BrainADZ Marketing.com">www.BrainADZ Marketing.com</a>{' '}
          </p>
          <Button
            type="primary"
            onClick={() => {
              window.open(`https://www.BrainADZ Marketing.com/contact`);
            }}
          >
            {translate('Contact us')}
          </Button>
        </>
      }
    />
  );
};

export default About;
