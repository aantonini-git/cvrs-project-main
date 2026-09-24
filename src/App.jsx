import { useState, useContext } from "react";
import { DataContext } from './context/DataContext';

import './App.css';
import CSVReader from '@uiw/react-csv-reader';
import { MdAddChart } from "react-icons/md";
import { PiPresentationChart } from "react-icons/pi";
import ConfigureData from './components/ConfigureData/ConfigureData.jsx';
import ConfigureRepresentation from './components/ConfigureRepresentation/ConfigureRepresentation.jsx';
import Techniques from './components/ConfigureTechniques/Techniques.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';


function App() {
  const { data, setData, selectedIds, setSelectedIds, categoricalData, setCategoricalData,
          selectedCategory, setSelectedCategory, identifiersList, setIdentifiersList,
          selectedIdentifier, setSelectedIdentifier} = useContext(DataContext);

  const [selectedWindow, setSelectedWindow] = useState('configure');
  const [categorizedList, setcategorizedList] = useState([]);
  const [userConfigArray, setUserConfigArray] = useState(Array(23).fill(0));
  const [userPriorityArray, setUserPriorityArray] = useState(Array(23).fill(0));
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  
  function handleSelectedIdentifier(selectedIdentifier){
    setSelectedIdentifier(selectedIdentifier)
  }

  function handleSelectedCategory(selectedCategory){
    setSelectedCategory(selectedCategory.toString())
  }

  function handleClickMenu(selectedButton) {
    setSelectedWindow(selectedButton);
  }

  function handleAddTechnique(technique){
    setSelectedTechnique({ ...technique });
  }

  function handleForce (dataHome) {
    let dataHomeAux = [];
    let categoricalData = [];
    let labels = dataHome[0]; // Primer elemento como etiquetas
  
    // Identificar columnas numéricas y categóricas
    let numericColumns = [];
    let categoricalColumns = [];
    for (let j = 0; j < labels.length; j++) {
      categoricalColumns.push(j); //Para que las columnas numericas también puedan considerarse categoricas
      if (!isNaN(parseFloat(dataHome[1][j].replace(',', '.')))) {
        numericColumns.push(j);
      }
    }
  
    // Iterar sobre los datos para limpiar y convertir solo las columnas numéricas y almacenar categóricas
    for (let i = 1; i < dataHome.length; i++) {
      let row = dataHome[i];
      let newRow = {};
      let newCategoricalRow = {};
  
      for (let j of numericColumns) {
        let value = row[j];
  
        // Convertir valores numéricos de string a números y ajustar a 4 decimales
        if (!isNaN(value) && value !== "") {
          value = parseFloat(value.replace(',', '.')); // Asegurar que los decimales usen punto
          value = Math.round(value * 10000) / 10000; // Redondear a 4 decimales
        }
  
        // Asignar el valor al nombre de la columna como clave
        newRow[labels[j]] = value;
        newRow['index'] = i-1;
      }
  
      for (let j of categoricalColumns) {
        newCategoricalRow[labels[j]] = row[j];
      }
  
      dataHomeAux.push(newRow);
      categoricalData.push(newCategoricalRow);
    }
    
    let numericLabels = numericColumns.map(index => labels[index]);
    // Etiquetas categóricas
    let categoricalLabels = categoricalColumns.map(index => labels[index]);

    setData(dataHomeAux);
    setCategoricalData(categoricalData);
    setIdentifiersList(numericLabels);
    setcategorizedList(categoricalLabels);
  };

  return (
  <div style={{ backgroundColor: "rgba(36,38,41,0.03)" }}>
    <section id="reactExamples">
      <menu>
        <MdAddChart className={selectedWindow === "configure" ? "active" : ""} onClick={() => handleClickMenu("configure")}/>
        <PiPresentationChart className={selectedWindow === "dashboard" ? "active" : ""} onClick={() => handleClickMenu("dashboard")}/>
      </menu>

      {/* Contenedor flex como antes */}
      <div style={{ display: "flex", gap: "1rem" }}>
        {/* Ventana Configure */}
        <div style={{flex: 1, display: selectedWindow === "configure" ? "block" : "none",}}>
          <div id="tab-content-data" style={{ width: "60%" }}>
            <CSVReader
              delimiters={[";", ","]}
              label="Upload New Data"
              onFileLoaded={handleForce}
            />
            {data !== null && (
              <ConfigureData
                categorizedList={categorizedList}
                onChangeId={handleSelectedIdentifier}
                onChangeCat={handleSelectedCategory}
              />
            )}
          </div>

          <div id="tab-content" style={{ width: "100%" }}>
            {data !== null && (
              <ConfigureRepresentation
                setUserConfigArray={setUserConfigArray}
                setUserPriorityArray={setUserPriorityArray}
              />
            )}
            {data !== null && (
              <Techniques
                userConfigArray={userConfigArray}
                userPriorityArray={userPriorityArray}
                handleAddTechnique={handleAddTechnique}
              />
            )}
          </div>
        </div>

        {/* Ventana Dashboard */}
        <div style={{flex: 1, display: selectedWindow === "dashboard" ? "block" : "none",}}>
          <Dashboard
            selectedTechnique={selectedTechnique}
            userConfigArray={userConfigArray}
          />
        </div>
      </div>
    </section>
  </div>
  );
}

export default App;
