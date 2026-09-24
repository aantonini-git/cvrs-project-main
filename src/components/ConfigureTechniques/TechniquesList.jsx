import { useEffect, useState } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
import { useSprings, animated } from 'react-spring';
import './Techniques.css';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { configuration_options } from "./configuration.js";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export default function TechniquesList({ userConfigArray, userPriorityArray, handleAddTechnique, techniques }) {

  const [techniquesList, setTechniquesList] = useState([]);
  const [show, setShow] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState(null);

  const handleClose = () => setShow(false);
  const handleShow = (technique) => {
    setShow(true); 
    setSelectedTechnique(technique);
  };

  // Actualiza la similitud de cada técnica cada vez que cambian las máscaras o los pesos
  useEffect(() => {
    const distancia_maxima = distancia_ponderada(
      bitwise_and_not(userConfigArray, invertirBits(userConfigArray)),
      userPriorityArray
    );

    const updated = techniques.map((technique) => {
      let similarity;
      const match = matchesBitmask(technique.bitcode, userConfigArray);
      if (match === 1) {
        similarity = 1;
      } else if (match === 0) {
        similarity = 0;
      } else {
        const distancia = distancia_ponderada(
          bitwise_and_not(userConfigArray, technique.bitcode),
          userPriorityArray
        );
        similarity = parseFloat(1 - distancia / distancia_maxima).toFixed(2);
      }

      return {
        ...technique,
        similarity: Number(similarity)
      };
    });
    setTechniquesList(updated);
  }, [techniques, userConfigArray, userPriorityArray]);

  function invertirBits(vector) {
    return vector.map(bit => bit === 0 ? 1 : 0);
  }

  function matchesBitmask(a, b) {
    let count = 0;
    let sum = 0;
    for (let i = 0; i < b.length; i++) {
      if (b[i] == 1) sum += 1;
      if (b[i] == 1 && a[i] != 1) count += 1;
    }
    if (sum === count) return 0;
    if (count === 0) return 1;
    return 2;
  }

  function bitwise_and_not(a, b) {
    const result = [];
    for (let i = 0; i < a.length; i++) {
      const aBit = parseInt(a[i]);
      const bBit = parseInt(b[i]);
      const notB = bBit === 0 ? 1 : 0;
      result.push(aBit & notB);
    }
    return result;
  }

  function distancia_ponderada(c, p) {
    let suma = 0;
    for (let i = 0; i < c.length; i++) {
      suma += c[i] * p[i];
    }
    return suma;
  }

  // Create springs for each button
  const [springs] = useSprings(
    techniquesList.length,
    techniquesList.map(() => ({
      from: { opacity: 0, transform: 'scale(0.8)' },
      to: { opacity: 1, transform: 'scale(1)' },
      scale: 1,
      config: { tension: 200, friction: 20 }
    })),
    [techniquesList]
  );

  function getColor(similarity, opacity = 1) {
    switch (similarity) {
      case 0:
        return `rgba(202, 86, 44, ${opacity})`;     // rojo quemado
      case 1:
        return `rgba(61, 89, 65, ${opacity})`;      // verde oscuro
      default:
        return `rgba(237, 187, 138, ${opacity})`;   // beige
    }
  }

  const colors = similarity => getColor(similarity, 0.2);
  const colors2 = similarity => getColor(similarity, 0.8);
  const colors3 = similarity => getColor(similarity, 1);

  // Genera las "badges"
  let badge = techniquesList.map(item => {
    return item.bitcode.map((bit, i) =>
      bit && userConfigArray[i] ? (
        <a key={i} className="badge bg-secondary text-decoration-none link-light">
          {configuration_options.find(option => option.bit === i).label}
        </a>
      ) : null
    );
  });

  return (
    <div>
      <Flipper flipKey={techniquesList.map(button => button.id).join('')}>
        
        {/* Exact Match */}
        <div className="containerTechnique">
          <h6 className="label">Exact Match</h6>
          <div className="displayFlex">
            {techniquesList
              .filter(t => t.similarity === 1)
              .map((technique, index) => {
                const spring = springs[techniquesList.indexOf(technique)];
                return (
                  <Flipped key={technique.id} flipId={technique.id}>
                    <animated.div style={{ ...spring }}>
                      <div onClick={() => handleShow(technique)} style={{ width: "100px" }}>
                        <img
                          src={technique.image}
                          alt={technique.name}
                          className="card-techniques"
                          width="100"
                          height="85"
                          style={{
                            backgroundColor: colors(technique.similarity),
                            borderColor: colors2(technique.similarity)
                          }}
                        />
                        <h6 style={{ color: colors3(technique.similarity) }}>{technique.name}</h6>
                        <ProgressBar 
                          className="progressbar-techniques" 
                          now={Math.round(technique.similarity * 100)} 
                          label={`${(technique.similarity * 100).toFixed(2)}%`}
                        >
                          <div 
                            className="label-progressbar-techniques" 
                            style={{
                              width: `${(technique.similarity * 100).toFixed(2)}%`,
                              backgroundColor: colors2(technique.similarity)
                            }}
                          >
                            {(technique.similarity * 100)}%
                          </div>
                        </ProgressBar>
                        <div style={{ width: "100%" }} >
                          {badge[techniquesList.indexOf(technique)]}
                        </div>
                      </div>
                    </animated.div>
                  </Flipped>
                );
              })}
          </div>
        </div>

        {/* Partial Match */}
        <div className="containerTechnique">
          <h6 className="label">Partial Match</h6>
          <div className="displayFlex">
            {techniquesList
              .filter(t => t.similarity > 0 && t.similarity < 1)
              .map((technique, index) => {
                const spring = springs[techniquesList.indexOf(technique)];
                return (
                  <Flipped key={technique.id} flipId={technique.id}>
                    <animated.div style={{ ...spring }}>
                      <div onClick={() => handleShow(technique)} style={{ width: "100px" }}>
                        <img
                          src={technique.image}
                          alt={technique.name}
                          className="card-techniques"
                          width="100"
                          height="85"
                          style={{
                            backgroundColor: colors(technique.similarity),
                            borderColor: colors2(technique.similarity)
                          }}
                        />
                        <h6 style={{ color: colors3(technique.similarity) }}>{technique.name}</h6>
                        <ProgressBar 
                          className="progressbar-techniques" 
                          now={Math.round(technique.similarity * 100)} 
                          label={`${(technique.similarity * 100).toFixed(2)}%`}
                        >
                          <div 
                            className="label-progressbar-techniques" 
                            style={{
                              width: `${(technique.similarity * 100).toFixed(2)}%`,
                              backgroundColor: colors2(technique.similarity)
                            }}
                          >
                            {(technique.similarity * 100).toFixed(2)}%
                          </div>
                        </ProgressBar>
                        <div style={{ width: "100%" }}>
                          {badge[techniquesList.indexOf(technique)]}
                        </div>
                      </div>
                    </animated.div>
                  </Flipped>
                );
              })}
          </div>
        </div>

        {/* No Match */}
        <div className="containerTechnique">
          <h6 className="label">No Match</h6>
          <div className="displayFlex">
            {techniquesList
              .filter(t => t.similarity === 0)
              .map((technique, index) => {
                const spring = springs[techniquesList.indexOf(technique)];
                return (
                  <Flipped key={technique.id} flipId={technique.id}>
                    <animated.div style={{ ...spring }}>
                      <div onClick={() => handleShow(technique)} style={{ width: "100px" }}>
                        <img
                          src={technique.image}
                          alt={technique.name}
                          className="card-techniques"
                          width="100"
                          height="85"
                          style={{
                            backgroundColor: colors(technique.similarity),
                            borderColor: colors2(technique.similarity)
                          }}
                        />
                        <h6 style={{ color: colors3(technique.similarity) }}>{technique.name}</h6>
                        <ProgressBar className="progressbar-techniques" now={0} label="0%">
                          <div 
                            className="label-progressbar-techniques" 
                            style={{width: "100%", color: colors2(technique.similarity) }}>
                            {`${(technique.similarity * 100).toFixed(2)}%`}
                          </div>
                        </ProgressBar>
                        <div style={{ width: "100%"}}>
                          {badge[techniquesList.indexOf(technique)]}
                        </div>
                      </div>
                    </animated.div>
                  </Flipped>
                );
              })}
          </div>
        </div>

      </Flipper>

      {/* Modal */}
      <Modal className="modal" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Attention</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>
            Add <i>{selectedTechnique?.name}</i> view to your dashboard?
          </h4>
          This will include a new <i>{selectedTechnique?.name}</i> visualization in your current layout.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => { handleAddTechnique(selectedTechnique); handleClose(); }}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
