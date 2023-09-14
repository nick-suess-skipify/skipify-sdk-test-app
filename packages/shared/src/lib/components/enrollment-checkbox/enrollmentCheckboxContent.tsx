import React, { useState } from "react";
import styled from "styled-components";
// Be careful with cyclic dependencies here

export const SkipifyEnrollmentCheckboxContent: React.FC = (props) => {
  const params = new URL(window.location.href).searchParams;
  const darkMode = Boolean(params.get("darkMode"));
  const [checked, setChecked] = useState(true);

  const handleCheckbox = () => {
    setChecked(!checked);
    window.top?.postMessage(
      {
        name: "@skipify/enrollment-checkbox-changed",
        value: !checked,
      },
      "*"
    );
  };

  return (
    <Container>
      <Checkbox
        checked={checked}
        onChange={() => handleCheckbox()}
        darkMode={darkMode}
      />
      <Content>
        <ContentTitle darkMode={darkMode}>
          Save my details for future checkouts
        </ContentTitle>
        <ContentDescription darkMode={darkMode}>
          Save your contact information and payment method to breeze through
          checkouts that are powered by Skipify.
        </ContentDescription>
        <Terms darkMode={darkMode}>
          By continuing, you agree to the Skipify{" "}
          <Link
            href="https://www.skipify.com/us/terms-and-conditions/"
            darkMode={darkMode}
          >
            Terms & Conditions
          </Link>{" "}
          and{" "}
          <Link
            href="https://www.skipify.com/us/privacy-policy/"
            darkMode={darkMode}
          >
            Privacy Policy
          </Link>
        </Terms>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  font-family: Poppins;
  border-radius: 5px;
  border: 1px solid #01ead3;
  padding: 16px 18px;
`;

const Checkbox = styled.input.attrs(() => ({
  type: "checkbox",
}))<{ darkMode: boolean }>`
  width: 17px;
  height: 17px;
  cursor: pointer;
  flex-shrink: 0;
  ${(props) =>
    props.darkMode
      ? `accent-color: ${props.checked ? "#01EAD3" : "#FFFFFF"};`
      : `accent-color: ${props.checked ? "#000000" : "#FFFFFF"};`}
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 18px;
`;

const ContentTitle = styled.div<{ darkMode: boolean }>`
  color: ${(props) => (props.darkMode ? "#FFFFFF" : "#000000")};
  font-weight: 600;
  font-size: 12px;
  font-family: Poppins;
  margin-bottom: 5px;
`;

const ContentDescription = styled.div<{ darkMode: boolean }>`
  color: ${(props) => (props.darkMode ? "#FFFFFF" : "#000000")};
  font-weight: 400;
  font-size: 12px;
  font-family: Poppins;
  margin-bottom: 16px;
`;

const Terms = styled.div<{ darkMode: boolean }>`
  color: ${(props) => (props.darkMode ? "#B2B2B2" : "#7a7a7a")};
  font-weight: 400;
  font-size: 10px;
  font-family: Poppins;
`;

const Link = styled.a.attrs({
  target: "_blank",
})<{ darkMode: boolean }>`
  color: ${(props) => (props.darkMode ? "#01EAD3" : "#1f7f79")};
  cursor: pointer;
  text-decoration: underline;
`;
