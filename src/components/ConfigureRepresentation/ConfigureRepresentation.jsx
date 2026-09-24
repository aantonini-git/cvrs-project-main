import './ConfigureRepresentation.css';
import { DragAndDrop } from "./DragAndDrop.jsx"
import Card from 'react-bootstrap/Card';

export default function ConfigureRepresentation({ setUserConfigArray, setUserPriorityArray }) {
  

  return (
    <div className="container-main" style={{ width: '70%'}}>
      <Card className="card-config">
      <Card.Header>Visual Representation & Taks</Card.Header>
      <Card.Body><DragAndDrop setUserConfigArray={setUserConfigArray} setUserPriorityArray={setUserPriorityArray}/></Card.Body>
      </Card>
    </div>
  );
}