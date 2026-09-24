import { useState } from 'react';
import Form from 'react-bootstrap/Form';

export const CardItem = ({ data, handleDragging, handleChange, handleFirstOptionCheck}) => {

  // Copiamos los checkboxes al estado local
  const [checkboxes, setCheckboxes] = useState(data.checkboxes);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text', `${data.id}`);
    handleDragging(true);
  };

  const handleDragEnd = () => handleDragging(false);

   const handleCheckboxChange = (index,data) => {
    const updated = [...checkboxes];
    if(data.status=='0')
      handleFirstOptionCheck(data.id,'1')

    updated[index].checked = !updated[index].checked;
    setCheckboxes(updated);
    handleChange();
  };

  return (
    <div
      className="card-container"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <p>{data.content}</p>
      {checkboxes.map((checkbox, index) => (
        <Form.Check
          key={index}
          type="checkbox"
          disabled={!checkbox.enabled}
          checked={checkbox.checked}
          onChange={() => handleCheckboxChange(index,data)}
          label={checkbox.label}
        />
      ))}
    </div>
  );
};
