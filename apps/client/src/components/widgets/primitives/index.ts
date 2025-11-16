/**
 * Widget Primitives Index
 *
 * Exports all primitive components and registers them in the registry.
 */

import { registerWidget } from '../registry';

// Layout primitives
import { Frame } from './Frame';
import { FrameHeader } from './FrameHeader';
import { Row } from './Row';
import { Col } from './Col';
import { Spacer } from './Spacer';
import { Divider } from './Divider';

// Content primitives
import { Text } from './Text';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
import { Amount } from './Amount';
import { Time } from './Time';
import { Badge } from './Badge';

// Interactive primitives
import { Button } from './Button';

// Pattern components
import { KeyValueRow } from './KeyValueRow';
import { KeyValueList } from './KeyValueList';
import { ButtonGroup } from './ButtonGroup';

// Register all primitives
registerWidget('Frame', Frame);
registerWidget('FrameHeader', FrameHeader);
registerWidget('Row', Row);
registerWidget('Col', Col);
registerWidget('Spacer', Spacer);
registerWidget('Divider', Divider);
registerWidget('Text', Text);
registerWidget('Icon', Icon);
registerWidget('Avatar', Avatar);
registerWidget('Amount', Amount);
registerWidget('Time', Time);
registerWidget('Badge', Badge);
registerWidget('Button', Button);
registerWidget('KeyValueRow', KeyValueRow);
registerWidget('KeyValueList', KeyValueList);
registerWidget('ButtonGroup', ButtonGroup);

// Export all primitives
export {
  Frame,
  FrameHeader,
  Row,
  Col,
  Spacer,
  Divider,
  Text,
  Icon,
  Avatar,
  Amount,
  Time,
  Badge,
  Button,
  KeyValueRow,
  KeyValueList,
  ButtonGroup,
};
