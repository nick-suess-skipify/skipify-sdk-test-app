/**
 * SDKConfigurator Component
 * 
 * This component provides a user interface for configuring optional SDK parameters
 *
 * Add any new SDK configs here so developers can test it
 */

import React from 'react';
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Heading,
    Text,
    VStack,
    FormControl,
    FormLabel,
    InputGroup,
    InputLeftAddon,
    Input,
    InputRightElement,
} from '@chakra-ui/react';

interface ColorInputProps {
    label: string;
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    placeholder: string;
}

const ColorInput: React.FC<ColorInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
}) => (
  <FormControl>
    <FormLabel>{label}</FormLabel>
    <InputGroup>
      <InputLeftAddon children="#" />
      <Input
        type="text"
        value={value ? value.replace('#', '') : ''}
        onChange={(e) =>
          onChange(e.target.value ? `#${e.target.value}` : undefined)
        }
        placeholder={placeholder}
      />
      <InputRightElement paddingRight="2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </InputRightElement>
    </InputGroup>
  </FormControl>
);

interface SDKConfigUIProps {
  buttonTextColor: string | undefined;
  buttonBgColor: string | undefined;
  buttonBgHoverColor: string | undefined;
  setButtonTextColor: (value: string | undefined) => void;
  setButtonBgColor: (value: string | undefined) => void;
  setButtonBgHoverColor: (value: string | undefined) => void;
}

export const SDKConfigurator: React.FC<SDKConfigUIProps> = ({
    buttonTextColor,
    buttonBgColor,
    buttonBgHoverColor,
    setButtonTextColor,
    setButtonBgColor,
    setButtonBgHoverColor,
}) => {
    return (
        <Accordion allowToggle>
            <AccordionItem>
                <AccordionButton>
                    <Heading size="md">Optional SDK Configuration Options</Heading>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                    <VStack spacing={4} align="stretch">
                    <Text size="sm" mb={4}>skipifyClient.button() Options</Text>
                        <ColorInput
                            label="Button Text Color (textColor)"
                            value={buttonTextColor}
                            onChange={setButtonTextColor}
                            placeholder="eg. FFFFFF"
                        />
                        <ColorInput
                            label="Button Background Color (bgColor)"
                            value={buttonBgColor}
                            onChange={setButtonBgColor}
                            placeholder="eg. 000000"
                        />
                        <ColorInput
                            label="Button Hover Background Color (bgHoverColor)"
                            value={buttonBgHoverColor}
                            onChange={setButtonBgHoverColor}
                            placeholder="eg. 444444"
                        />
                    </VStack>
                    <Text fontSize="sm" mt="4" fontStyle="italic" color="gray.600">
                        Note: Some styles may be ignored for the "V2" button. If you don't see the effect of your changes, try changing the merchant ID.
                    </Text>
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    );
};