import { useCallback } from "react";
import { CardItem } from "./CardItem";
import './ContainerCards.css';

export const ContainerCards = ({
  items = [],
  status,
  isDragging,
  handleUpdateList,
  handleDragging,
  updateUserConfigArray,
  updateUserPriorityArray
}) => {

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const id = +e.dataTransfer.getData("text");
    handleUpdateList(id, status);
    handleDragging(false);
    updateUserPriorityArray();
  }, [handleUpdateList, handleDragging, status]);

  function handleFirstOptionCheck(id,status){
    handleUpdateList(id, status);
    handleDragging(false);
    updateUserPriorityArray();
  }

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div
      className={`layout-cards ${isDragging ? "layout-dragging" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
    <h6>Priority {status}</h6>
      {items.map(
        (item) =>
          item.status === status && (
            <CardItem
              key={item.id}
              data={item}
              handleDragging={handleDragging}
              handleChange={updateUserConfigArray}
              handleFirstOptionCheck={handleFirstOptionCheck}
            />
          )
      )}
    </div>
  );
};