import Card from 'react-bootstrap/Card';
import './Techniques.css';
import TechniquesList from './TechniquesList.jsx';
import { techniques } from "./techniques.js";

export default function Techniques({userConfigArray, userPriorityArray, handleAddTechnique}) {
  
  return (
    <div className="container-main" style={{ width: '28%' }}>
      <Card className="card-config" style={{ width: '100%' }}>
      <Card.Header>Techniques</Card.Header>
      <Card.Body><TechniquesList userConfigArray={userConfigArray} userPriorityArray={userPriorityArray} handleAddTechnique={handleAddTechnique} techniques={techniques}/></Card.Body>
      </Card>
    </div>
  );
}