/**
 * Widget Primitives Index
 *
 * Exports all primitive components and registers them in the registry.
 */

import { registerWidget } from '../registry';

// Layout primitives
import { Frame } from './Frame';
import { FrameHeader } from './FrameHeader';
import { FrameTitle } from './FrameTitle';
import { FrameActions } from './FrameActions';
import { FrameClose } from './FrameClose';
import { FrameExpand } from './FrameExpand';
import { FrameContent } from './FrameContent';
import { Row } from './Row';
import { Col } from './Col';
import { Spacer } from './Spacer';
import { Divider } from './Divider';

// Content primitives
import { Text } from './Text';
import { Avatar } from './Avatar';
import { Amount } from './Amount';
import { Time } from './Time';

// Interactive primitives
import { Button } from './Button';

// Pattern components
import { KeyValueRow } from './KeyValueRow';
import { KeyValueList } from './KeyValueList';
import { ButtonGroup } from './ButtonGroup';

// Register all primitives
registerWidget('Frame', Frame);
registerWidget('FrameHeader', FrameHeader);
registerWidget('FrameTitle', FrameTitle);
registerWidget('FrameActions', FrameActions);
registerWidget('FrameClose', FrameClose);
registerWidget('FrameExpand', FrameExpand);
registerWidget('FrameContent', FrameContent);
registerWidget('Row', Row);
registerWidget('Col', Col);
registerWidget('Spacer', Spacer);
registerWidget('Divider', Divider);
registerWidget('Text', Text);
registerWidget('Avatar', Avatar);
registerWidget('Amount', Amount);
registerWidget('Time', Time);
registerWidget('Button', Button);
registerWidget('KeyValueRow', KeyValueRow);
registerWidget('KeyValueList', KeyValueList);
registerWidget('ButtonGroup', ButtonGroup);

// Export all primitives
export {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameActions,
  FrameClose,
  FrameExpand,
  FrameContent,
  Row,
  Col,
  Spacer,
  Divider,
  Text,
  Avatar,
  Amount,
  Time,
  Button,
  KeyValueRow,
  KeyValueList,
  ButtonGroup,
};
