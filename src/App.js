import React, { useReducer, useEffect, useCallback, useState } from "react";

const initialState = {
  isLoading: true,
  races: [],
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_INIT":
      return { ...state, isLoading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, isLoading: false, races: action.payload };
    case "FETCH_FAILURE":
      return { ...state, isLoading: false, error: action.payload };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function RaceTable() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showResults, setShowResults] = useState(false);
  const [selectedRace, setSelectedRace] = useState(null);

  function normalizeString(str) {
    const charMap = {
      'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE', 'Ç': 'C',
      'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
      'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', '×': 'x',
      'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U', 'Ý': 'Y', 'ß': 'ss', 'à': 'a',
      'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae', 'ç': 'c', 'è': 'e',
      'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ð': 'd',
      'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'ù': 'u',
      'ú': 'u', 'û': 'u', 'ü': 'u', 'ý': 'y', 'ÿ': 'y', 'Ł': 'L', 'ł': 'l', 'Ń': 'N',
      'ń': 'n', 'Œ': 'OE', 'œ': 'oe', 'Ś': 'S', 'ś': 's', 'Š': 'S', 'š': 's', 'Ÿ': 'Y',
      'Ž': 'Z', 'ž': 'z', 'ƒ': 'f', 'Ș': 'S', 'ș': 's', 'Ț': 'T', 'ț': 't'
    };
  
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/gi, function(match) {
      return charMap[match] || '';
    });
  }  

  const fetchRaceData = useCallback(async () => {
    dispatch({ type: "FETCH_INIT" });
    try {
      const response = await fetch(
        "https://ergast.com/api/f1/current.json"
      );
      const data = await response.json();
      const racesWithRound = data.MRData.RaceTable.Races
      dispatch({ type: "FETCH_SUCCESS", payload: racesWithRound });
    } catch (error) {
      dispatch({ type: "FETCH_FAILURE", payload: error.message });
    }
  }, []);

  const fetchRaceResults = useCallback(async (round) => {
    const url = `https://ergast.com/api/f1/current/${round}/results.json`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const results = data.MRData.RaceTable.Races[0].Results.map(result => {
        const driver = result.Driver;
        const driverDisplayName = `${driver.givenName} ${driver.familyName}`
        const formatGivenName = normalizeString(driver.givenName)
        const formatFamilyName = normalizeString(driver.familyName)
        var driverURLName = formatGivenName+'-'+formatFamilyName
        driverURLName = driverURLName.toLowerCase()
        
        const driverImageURL = `https://www.formula1.com/content/fom-website/en/drivers/${driverURLName}/jcr:content/image.img.1920.medium.jpg/1677069223130.jpg`
        // Fetch driver headshot image from Wikipedia API

        return {
          position: result.position,
          driver: driverDisplayName,
          nationality: driver.nationality,
          team: result.Constructor.name,
          time: result.time && result.time.time,
          points: result.points,
          headshotUrl: driverImageURL
        }
      });
      console.log(data); // or do something else with the data

      // Open modal with race results
      setSelectedRace(results);
      setShowResults(true);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchRaceData();
  }, [fetchRaceData]);

  return (
    <div className="race-table-container">
      {state.isLoading ? (
        <p>Loading...</p>
      ) : state.error ? (
        <p>{state.error}</p>
      ) : (
        <table className="race-table">
          <thead>
            <tr>
              <th>Round</th>
              <th>Race name</th>
              <th>Circuit name</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {state.races.map((race) => (
              <tr key={race.round}>
                <td>{race.round}</td>
                <td onClick={() => fetchRaceResults(race.round)} className="clickable">
                  {race.raceName}
                </td>
                <td>{race.Circuit.circuitName}</td>
                <td>{race.date}</td>
                <td>{race.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Race Results Modal */}
      {showResults && (
        <div className="modal" onClick={() => setShowResults(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedRace[0].raceName} Results</h2>
            <table className="results-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Headshot</th> {/* new column */}
                  <th>Driver</th>
                  <th>Nationality</th>
                  <th>Team</th>
                  <th>Time</th>
                  <th>Points</th>
                  
                </tr>
              </thead>
              <tbody>
                {selectedRace.map((result, index) => (
                  <tr key={index}>
                    <td>{result.position}</td>
                    <td>
                      {result.headshotUrl && (
                        <img className="driver-image" src={result.headshotUrl} alt={`${result.driver} headshot`} />
                      )}
                    </td>
                    <td>{result.driver}</td>
                    <td>{result.nationality}</td>
                    <td>{result.team}</td>
                    <td>{result.time}</td>
                    <td>{result.points}</td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>


  );
}

export default RaceTable;
