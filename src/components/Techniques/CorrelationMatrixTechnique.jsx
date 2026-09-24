import { useEffect, useState, useContext } from 'react';
import { DataContext } from "../../context/DataContext.jsx";

import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import './Styles/CorrelationMatrixStyles.css';
import { configuration_options } from "../ConfigureTechniques/configuration.js";

export default function CorrelationMatrixTechnique({ id, iddiv, userConfigArray, flag }) {
 
  const { data, selectedIds, setSelectedIds, categoricalData,
    selectedCategory, identifiersList} = useContext(DataContext);

  const [visualChannel, setVisualChannel] = useState('Color');
  const [visualChannelOption, setVisualChannelOption] = useState(['Color','Size']);
  const [vsOptions, setVsOption] = useState([]);

  useEffect(() => {
    const idColor = configuration_options.find(opt => opt.label === "Color")?.bit;
    const idSize = configuration_options.find(opt => opt.label === "Size")?.bit;

    var vs;
    (userConfigArray[idSize]==1 && userConfigArray[idColor]==0)?vs='Size':vs='Color';
    setVisualChannel(vs);

    var vsOptions = [];
    for(let i = 0; i<visualChannelOption.length; i++){
      vsOptions.push(<Dropdown.Item id={i} key={i} eventKey={i}> {visualChannelOption[i]}</Dropdown.Item>);
    }
    setVsOption(vsOptions)
  }, [userConfigArray]);

  useEffect(() => {
    drawChart(data, visualChannel);
  }, [data,flag]);

  function drawChart(data, newChannel){
  // Extraer nombres de atributos
    const atributos = identifiersList;

    const config = {
      string: false,
      decimals: 2,
    };

    function correlacionPearson(x, y) {
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

      if (denominator === 0) {
        return 0; // No correlación si el denominador es cero
      }

      return numerator / denominator;
    }

   // Función para calcular la matriz de correlación
    function calcularMatrizDeCorrelacion(data, atributos) {
      

      var matrix = [];
      atributos.forEach((atributo1) => {
        const x = data.map(d => d[atributo1]);
        let fila = [];
        atributos.forEach((atributo2) => {
          const y = data.map(d => d[atributo2]);
          const correlation = correlacionPearson(x, y);
          fila.push(correlation.toFixed(2));
        });
        matrix.push(fila);
      });
      return matrix;
    }

    var xValues = atributos;
    var yValues = atributos;
    var zValues = calcularMatrizDeCorrelacion(data, atributos);
    var margin = {top: 20, right: 50, bottom: 50, left: 20},
    width = document.getElementById(''+iddiv).offsetWidth == 0? 550 : document.getElementById(''+iddiv).offsetWidth - margin.right - margin.left,
    height = document.getElementById(''+iddiv).offsetHeight == 0? 550 :  document.getElementById(''+iddiv).offsetHeight - margin.bottom - margin.top;
    
    var colorscaleValue = [
      [0, 'rgba(78, 115, 223,0.1)'],
      [1, 'rgba(78, 115, 223,1)']
    ];

    var data = [];

    if (newChannel == 'Color') {
      data = [{
        x: xValues,
        y: yValues,
        z: zValues,
        type: 'heatmap',
        colorscale: colorscaleValue,
        showscale: false
      }];
    } else {
      var zAbsValues = zValues.map(subArray => subArray.map(value => Math.abs(value)*40));
      var flattenedArray = zAbsValues.reduce((acc, subArray) => acc.concat(subArray), []);
      var xData = [],yData = [];

      for (let i = 0; i < atributos.length; i++) {
        for (let j = 0; j < atributos.length; j++) {
          xData.push(atributos[i]);
          yData.push(atributos[j]);
        }
      }
      data=[ {
        x: xData,
        y: yData,
        mode: 'markers',
        marker: {
          symbol:'circle',
          color:flattenedArray,
          colorscale: colorscaleValue,
          size: flattenedArray ,
          showscale: true,
        },
        showscale: false,

      }];
    }

    var layout = {
      title: '',
      annotations: [],
      width: width,
      height: height,
      margin: {
        l: 100,
        r: 20,
        b: 50,
        t: 20,
        pad: 0
      },
    };

    for ( var i = 0; i < yValues.length; i++ ) {
      for ( var j = 0; j < xValues.length; j++ ) {
        var currentValue = zValues[i][j];
        if (currentValue > 0.6 ) {
          var textColor = 'white';
        }else{
          var textColor = 'black';
        }
        var result = {
          xref: 'x1',
          yref: 'y1',
          x: xValues[j],
          y: yValues[i],
          text: zValues[i][j],
          font: {
            family: 'Arial',
            size: 4,
            color: textColor
          },
          showarrow: false,
        };
        layout.annotations.push(result);
      }
    }

    // Calcular la matriz de correlación
    Plotly.newPlot(id, data, layout);

  }

  function selectOption(evt){
    const newChannel = visualChannelOption[evt];
    drawChart(data, newChannel);
    setVisualChannel(visualChannelOption[evt]);
  }

  return (
    <div>
      <div className="configuration dropdown-option" style={{display:"flex"}}>
        <p> visual channels:</p>
        <div className="dropdown-option" style={{display:"flex"}}>
        <DropdownButton title={visualChannel} id={"btn-axisx"} onSelect={(e) => selectOption(e)}>
          {vsOptions}
        </DropdownButton>
        </div>
      </div>
      <div id={id}  className="correlationmatrix" style={{position:"absolute"}}></div>
    </div>
  );
}