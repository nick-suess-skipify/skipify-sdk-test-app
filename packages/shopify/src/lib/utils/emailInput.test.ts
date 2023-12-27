import { fireEvent } from '@testing-library/dom';
import { EmailInput } from './emailInput';

function setUpInputElement(): HTMLInputElement {
  const el = document.createElement('input');
  el.setAttribute('type', 'email');
  return el;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('It attaches to an email input', () => {
  const node = setUpInputElement();

  const test = new EmailInput({
    node,
    setUserEmail: jest.fn,
    onChange: jest.fn,
  });

  expect(test).toBeTruthy();
});

test('can be configured to set user email on blur', () => {
  const node = setUpInputElement();

  const test = new EmailInput({
    node,
    setUserEmail: jest.fn(),
    onChange: jest.fn(),
    options: {
      mode: 'onBlur',
    },
  });

  fireEvent.change(node, { target: { value: 'email@email.email' } });
  expect(test.setUserEmail).not.toBeCalled();

  fireEvent.blur(node);
  expect(test.setUserEmail).toBeCalled();
});

test('defaults to debounced input', () => {
  jest.useFakeTimers();
  const node = setUpInputElement();

  const test = new EmailInput({
    node,
    setUserEmail: jest.fn(),
    onChange: jest.fn(),
  });

  fireEvent.change(node, { target: { value: 'email@email.email' } });
  expect(test.setUserEmail).not.toBeCalled();

  jest.advanceTimersByTime(400);
  expect(test.setUserEmail).toBeCalled();
});

test('debounce time is configurable', () => {
  jest.useFakeTimers();
  const node = setUpInputElement();

  const test = new EmailInput({
    node,
    setUserEmail: jest.fn(),
    onChange: jest.fn(),
    options: {
      mode: 'onChange',
      debounceTime: 500,
    },
  });

  fireEvent.change(node, { target: { value: 'email@email.email' } });

  jest.advanceTimersByTime(400);
  expect(test.setUserEmail).not.toBeCalled();
  jest.advanceTimersByTime(200);
  expect(test.setUserEmail).toBeCalled();
});
