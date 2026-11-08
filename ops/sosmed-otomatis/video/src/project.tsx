import {makeProject} from '@revideo/core';
import './fonts.css';
import video from './scenes/video';

export default makeProject({
  scenes: [video],
  variables: {data: null},
  settings: {shared: {size: {x: 1080, y: 1920}, background: '#062015'}},
});
