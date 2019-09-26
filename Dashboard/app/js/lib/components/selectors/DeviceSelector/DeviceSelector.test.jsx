import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import DeviceSelector from './index';
import '@testing-library/jest-dom/extend-expect';

// https://github.com/testing-library/react-testing-library#suppressing-unnecessary-warnings-on-react-dom-168
// eslint-disable-next-line no-console
const originalError = console.error;
beforeAll(() => {
  // eslint-disable-next-line no-console
  console.error = (...args) => {
    if (/supports * the "act"/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  // eslint-disable-next-line no-console
  console.error = originalError;
});


// Main Tests
describe('DeviceSelector Tests', () => {
  afterEach(cleanup);


  const deviceGroupNames = { 1: 'Devices not in a group' };
  const deviceGroups = {
    1: {
      150452032: { name: 'droidxx', checked: false },
      150482013: { name: 'jana', checked: false },
    },
  };

  it('+++ renders <snapshot>', () => {
    const wrapper = render(
      <DeviceSelector
        deviceGroupNames={deviceGroupNames}
        deviceGroups={deviceGroups}
        onCheck={jest.fn()}
      />
    );

    expect(wrapper.container).toMatchSnapshot();
  });

  it('+++ toggles accordion', () => {
    const wrapper = render(
      <DeviceSelector
        deviceGroupNames={deviceGroupNames}
        deviceGroups={deviceGroups}
        onCheck={jest.fn()}
      />
    );

    // find and click on accordion
    const accordion = wrapper.getByTestId('accordion');
    fireEvent.click(accordion);

    // expect panel display to be block
    const panel = wrapper.getByTestId('panel');
    expect(panel).toHaveStyle('display: block');
    expect(wrapper.container).toMatchSnapshot();
  });

  test('+++ checkbox works', () => {
    const onCheck = jest.fn();

    const wrapper = render(
      <DeviceSelector
        deviceGroupNames={deviceGroupNames}
        deviceGroups={deviceGroups}
        onCheck={onCheck}
      />
    );

    // find input and trigger a check
    const inputNode = wrapper.getByLabelText('jana');
    fireEvent.click(inputNode);

    expect(onCheck).toHaveBeenCalledTimes(1);
    expect(onCheck).toHaveBeenCalledWith('150482013', true);
  });
});
