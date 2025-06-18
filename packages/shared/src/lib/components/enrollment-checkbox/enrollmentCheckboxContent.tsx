import React, { useState } from 'react';
import styled from 'styled-components';
// Be careful with cyclic dependencies here

export const SkipifyEnrollmentCheckboxContent: React.FC = (props) => {
    const params = new URL(window.location.href).searchParams;
    const darkMode = Boolean(params.get('darkMode'));
    const [checked, setChecked] = useState(true);

    const handleCheckbox = () => {
        setChecked(!checked);
        window.top?.postMessage(
            {
                name: '@skipify/enrollment-checkbox-changed',
                value: !checked,
            },
            '*',
        );
    };

    return (
        <Container darkMode={darkMode} checked={checked} onClick={handleCheckbox}>
            <InnerContainer>
                <CheckboxRow>
                    <CheckboxArea>
                        <Checkbox 
                            checked={checked} 
                            onChange={handleCheckbox}
                            darkMode={darkMode}
                            type="checkbox"
                        />
                    </CheckboxArea>
                    <ContentTitle darkMode={darkMode}>Save my details for future checkouts</ContentTitle>
                </CheckboxRow>
            </InnerContainer>
            <TermsContainer>
                <TermsText darkMode={darkMode}>
                    By continuing, you agree to the Skipify{' '}
                    <Link href="https://www.skipify.com/us/terms-and-conditions/" darkMode={darkMode}>
                        Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="https://www.skipify.com/us/privacy-policy/" darkMode={darkMode}>
                        Privacy Policy.
                    </Link>
                </TermsText>
            </TermsContainer>
        </Container>
    );
};

const Container = styled.div<{ darkMode: boolean; checked: boolean }>`
    width: 100%;
    padding: 4px 4px 16px 4px;
    background: ${(props) => (props.darkMode ? '#1E1E1E' : 'white')};
    border-radius: 8px;
    outline: 1px solid ${(props) => {
        if (props.checked) {
            return '#01EAD3';
        }
        return props.darkMode ? '#404040' : '#E0E0E0';
    }};
    outline-offset: -1px;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    display: flex;
    font-family: Poppins;
    box-sizing: border-box;
    cursor: pointer;
`;

const InnerContainer = styled.div`
    align-self: stretch;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 4px;
    display: flex;
`;

const CheckboxRow = styled.div`
    align-self: stretch;
    justify-content: flex-start;
    align-items: center;
    gap: 4px;
    display: flex;
`;

const CheckboxArea = styled.div`
    padding: 12px;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 8px;
    display: flex;
`;

const Checkbox = styled.input<{ darkMode: boolean }>`
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: ${(props) => (props.darkMode ? '#01EAD3' : '#1F7F79')};
`;

const ContentTitle = styled.div<{ darkMode: boolean }>`
    flex: 1 1 0;
    color: ${(props) => (props.darkMode ? '#FFFFFF' : '#1E1E1E')};
    font-size: 14px;
    font-family: Poppins;
    font-weight: 400;
    line-height: 18px;
    word-wrap: break-word;
`;

const TermsContainer = styled.div`
    align-self: stretch;
    padding-left: 12px;
    padding-right: 12px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    display: flex;
`;

const TermsText = styled.div<{ darkMode: boolean }>`
    flex: 1 1 0;
    color: ${(props) => (props.darkMode ? '#B2B2B2' : '#737373')};
    font-size: 12px;
    font-family: Poppins;
    font-weight: 400;
    line-height: 16px;
    word-wrap: break-word;
`;

const Link = styled.a.attrs({
    target: '_blank',
})<{ darkMode: boolean }>`
    color: ${(props) => (props.darkMode ? '#01EAD3' : '#1F7F79')};
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    
    &:hover {
        text-decoration: underline;
    }
`;
