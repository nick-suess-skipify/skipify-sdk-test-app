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
    Select,
} from '@chakra-ui/react';

interface ColorInputProps {
    label: string;
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    placeholder: string;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange, placeholder }) => (
    <FormControl>
        <FormLabel>{label}</FormLabel>
        <InputGroup>
            <InputLeftAddon children="#" />
            <Input
                type="text"
                value={value ? value.replace('#', '') : ''}
                onChange={(e) => onChange(e.target.value ? `#${e.target.value}` : undefined)}
                placeholder={placeholder}
            />
            <InputRightElement paddingRight="2">
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
            </InputRightElement>
        </InputGroup>
    </FormControl>
);

interface SDKConfigUIProps {
    buttonTextColor: string | undefined;
    buttonBgColor: string | undefined;
    buttonBgHoverColor: string | undefined;
    logoPlacement: 'inside' | 'below' | undefined;
    buttonLabel: 'Buy Now' | 'Pay Now' | undefined;
    setButtonTextColor: (value: string | undefined) => void;
    setButtonBgColor: (value: string | undefined) => void;
    setButtonBgHoverColor: (value: string | undefined) => void;
    setLogoPlacement: (value: 'inside' | 'below' | undefined) => void;
    setButtonLabel: (value: 'Buy Now' | 'Pay Now' | undefined) => void;
}

export const SDKConfigurator: React.FC<SDKConfigUIProps> = ({
    buttonTextColor,
    buttonBgColor,
    buttonBgHoverColor,
    logoPlacement,
    buttonLabel,
    setButtonTextColor,
    setButtonBgColor,
    setButtonBgHoverColor,
    setLogoPlacement,
    setButtonLabel,
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
                        <Text size="sm" mb={4}>
                            skipifyClient.button() Options
                        </Text>
                        <ColorInput
                            label="Button Text Color (textColor, default #FEFEFE)"
                            value={buttonTextColor}
                            onChange={setButtonTextColor}
                            placeholder="eg. FEFEFE"
                        />
                        <ColorInput
                            label="Button Background Color (bgColor, default #1E1E1E)"
                            value={buttonBgColor}
                            onChange={setButtonBgColor}
                            placeholder="eg. 1E1E1E"
                        />
                        <ColorInput
                            label="Button Hover Background Color (bgHoverColor, default #444444)"
                            value={buttonBgHoverColor}
                            onChange={setButtonBgHoverColor}
                            placeholder="eg. 444444"
                        />
                        <FormControl>
                            <FormLabel>Logo Placement</FormLabel>
                            <Select
                                value={logoPlacement || ''}
                                onChange={(e) => setLogoPlacement(e.target.value as 'inside' | 'below' | undefined)}
                            >
                                <option value="">Select Logo Placement (default "Inside")</option>
                                <option value="inside">inside</option>
                                <option value="below">below</option>
                                <option value="invalid">Invalid value (should fallback to default)</option>
                            </Select>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Button Label</FormLabel>
                            <Select
                                value={buttonLabel || ''}
                                onChange={(e) => setButtonLabel(e.target.value as 'Buy Now' | 'Pay Now' | undefined)}
                            >
                                <option value="">Select Button Label (default "Buy Now")</option>
                                <option value="Buy Now">Buy Now</option>
                                <option value="Pay Now">Pay Now</option>
                                <option value="invalid">Invalid value (should fallback to default)</option>
                            </Select>
                        </FormControl>
                    </VStack>
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    );
};
