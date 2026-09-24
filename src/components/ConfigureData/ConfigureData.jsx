import { useState, useContext } from "react";
import { DataContext } from "../../context/DataContext.jsx";

import './ConfigureData.css';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function ConfigureData({ categorizedList, onChangeId, onChangeCat }) {
  const { selectedCategory, setSelectedCategory, identifiersList} = useContext(DataContext);

  const [selectedIdentifiers, setSelectedIdentifiers] = useState(false);

  // Estados para los valores seleccionados
  const [identifierValue, setIdentifierValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('');

  // Inicializar con la primera opción al montar
  
  if (identifiersList.length > 0 && identifierValue=='' && selectedIdentifiers) {
    setIdentifierValue(identifiersList[0]);
    onChangeId(identifiersList[0]);
  }
  
	if (categorizedList.length > 0 && categoryValue=='' && selectedCategory) {
    setCategoryValue(categorizedList[0]);
    onChangeCat(categorizedList[0]);
  }

  return (
    <Card className="card-config" style={{ width: '100%' }}>
      <Card.Header>Data</Card.Header>
      <Card.Body>
        <Form.Group className="mb-1" controlId="formBasicCheckbox">
          <Form.Check
            type="checkbox"
            label="My data includes identifiers"
            onChange={() => setSelectedIdentifiers(!selectedIdentifiers)}
          />
          <Form.Select
            disabled={!selectedIdentifiers}
            value={identifierValue}
            onChange={(e) => {
              setIdentifierValue(e.target.value);
              onChangeId(e.target.value);
            }}
          >
            {identifiersList.map((conceptItem) =>
              <option className="form-select-option" key={"id" + conceptItem} value={conceptItem}>
                {conceptItem}
              </option>
            )}
          </Form.Select>
        </Form.Group>
        <br/>
        <Form.Group className="mb-1" controlId="formBasicCheckbox">
          <Form.Check
            type="checkbox"
            label="My data is categorized"
            onChange={() => setSelectedCategory(!selectedCategory)}
          />
          <Form.Select
            disabled={!selectedCategory}
            value={categoryValue}
            onChange={(e) => {
              setCategoryValue(e.target.value);
              onChangeCat(e.target.value);
            }}
          >
            {categorizedList.map((conceptItem) =>
              <option className="form-select-option" key={"cat" + conceptItem} value={conceptItem}>
                {conceptItem}
              </option>
            )}
          </Form.Select>
        </Form.Group>
      </Card.Body>
    </Card>
  );
}