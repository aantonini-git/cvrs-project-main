import { useState } from 'react';
import { data } from "./data.js";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { ContainerCards } from "./ContainerCards";
import Button from 'react-bootstrap/Button';

const initialPriorities = ['2', '1', '0'];
const prioritiesToAdd = ['3', '4', '5', '6'];

export const DragAndDrop = ({setUserConfigArray, setUserPriorityArray}) => {
  const { isDragging, listItems, handleDragging, handleUpdateList } = useDragAndDrop(data);

  const [priorities, setPriorities] = useState(initialPriorities);
  const [remainingPriorities, setRemainingPriorities] = useState(prioritiesToAdd);

  const addGroup = () => {
    if (remainingPriorities.length === 0) return;

    const next = remainingPriorities[0];
    const nextNum = Number(next);
    const updatedPriorities = [...priorities];

    // Encontrar el índice correcto para mantener orden descendente
    const insertIndex = updatedPriorities.findIndex(p => Number(p) < nextNum);

    if (insertIndex === -1) {
      // Si no hay ninguno menor, se agrega al final (es el más pequeño)
      updatedPriorities.push(next);
    } else {
      // Insertar antes del primero que sea menor
      updatedPriorities.splice(insertIndex, 0, next);
    }

    setPriorities(updatedPriorities);
    setRemainingPriorities(remainingPriorities.slice(1));
  };

  const updateUserConfigArray = () => {
    var userConfigArray = Array(23).fill(0);
    listItems.forEach((item)=>{
      item.checkboxes.forEach((itemCheck)=>{
        userConfigArray[itemCheck.bit] = itemCheck.checked?1:0;
      })
    })
    setUserConfigArray(userConfigArray)
  }

  const updateUserPriorityArray = () => {
    var userPriorityArray = Array(23).fill(0);
    data.forEach((item)=>{
      item.checkboxes.forEach((itemCheck)=>{
        userPriorityArray[itemCheck.bit] = parseInt(item.status);
      })
    })
    setUserPriorityArray(userPriorityArray)
  }

  return (
    <div className="justify-content-center">
      <div className="grid">
        {
          priorities.map(container => (
            <ContainerCards
              items={listItems}
              status={container}
              key={container}
              isDragging={isDragging}
              handleDragging={handleDragging}
              handleUpdateList={handleUpdateList}
              updateUserConfigArray = {updateUserConfigArray}
              updateUserPriorityArray = {updateUserPriorityArray}
            />
          ))
        }
      </div>
      <Button style={{ position: "relative", left: "20%" }} onClick={addGroup}>
        Add intermediate priority group
      </Button>
    </div>
  );
};
