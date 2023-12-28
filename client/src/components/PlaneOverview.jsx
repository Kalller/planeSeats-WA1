import React, { useState, useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useParams, Link } from 'react-router-dom';
import API from '../API';
import { Button, Col, Row, Container, Form, Alert } from 'react-bootstrap';

const planesData = [
    {
        title: 'LOCAL',

    },
    {
        title: 'REGIONAL',

    },
    {
        title: 'INTERNATIONAL',

    },
];

function PlaneOverview(props) {

    const params = useParams();
    const type = params.type === 'local' ? '1' : params.type === 'regional' ? '2' : '3';

    const loggedIn = props.loggedIn


    const totalSeats = type === '1' ? 60 : type === '2' ? 100 : 150;

    const [occupied, setOccupied] = useState([]);
    const [selected, setSelected] = useState([]);
    const [highlight, setHighlight] = useState([]);
    const [booked, setBooked] = useState([])
    const [confirm, setConfirm] = useState(false);

    const [mode, setMode] = useState(!props.isLoggedIn);
    const [numSeats, setNumSeats] = useState(0);
    const [update, setUpdate] = useState(false)
    const [message, setMessage] = useState('');

    const getInfos = async () => {
        const airplane = await API.getAirplaneByType(type);
        setOccupied(airplane.seats);
        if (loggedIn) {
            const reservations = await API.getReservationsById(props.user.id);
            setBooked(reservations[type - 1]);
        }
    };

    useEffect(() => {
        
        setSelected([]);
        setNumSeats(0);
        setConfirm(false)
        getInfos();
    }, [update, loggedIn]);

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!confirm) {
            // First time clicking Book button
            setConfirm(true);
            return;
        }

        API.createReservation(type, selected, props.user.id)
            .then(() => {
                setUpdate((prevState) => !prevState)
                setMessage({ msg: `Seats Reserved successfully!`, type: 'success' });
                setConfirm(false);
            })
            .catch((err) => {
                if (err.alreadyReserved) {
                    setSelected([]);
                    setHighlight(err.alreadyReserved);
                    setMessage({ msg: `Seats highlighted in yellow have been booked by another user! Reservation Lost!`, type: 'warning' });
                    setTimeout(() => {
                        setHighlight([]);
                        setUpdate((prevState) => !prevState)
                    }, 5000);
                }
            });

    };

    return (
        <Container className='container-group pt-1 pb-3' style={{ paddingTop: '1rem' }}>

            {message && <div className='text-center' >
                <Alert className='dynamic-alert' variant={message.type} onClose={() => setMessage('')} dismissible>{message.msg}</Alert>
            </div>}

            <div className='h1 text-center' >
                {planesData[type - 1].title}
            </div>
            <div className=''>
                <Container className="d-flex justify-content-evenly">
                    <Form onSubmit={handleSubmit}>
                        <Container className="d-flex sticky-container pb-3">
                            <div >
                                <Link to='/planes' style={{ paddingRight: '5px' }}>
                                    <i className="bi bi-arrow-left-circle-fill" style={{ fontSize: '230%' }}></i>
                                </Link>
                            </div>
                            {!booked.length > 0 &&
                                <div>
                                    <div className='m-2'>
                                        {props.loggedIn && <Switch setMode={setMode} setConfirm={setConfirm} setSelected={setSelected} setNumSeats={setNumSeats} mode={mode} />}
                                    </div>
                                    <div className='p-2 '>
                                        <div className='p-2 '>
                                            {(props.loggedIn && highlight.length === 0) ? (
                                                confirm ? (
                                                    <div>
                                                        <Button variant="success" type="submit">
                                                            Book
                                                        </Button>

                                                        <Button variant="danger" onClick={() => {
                                                            setUpdate((prevState) => !prevState)
                                                        }}>
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) :
                                                    props.loggedIn ? (numSeats > 0 || selected.length > 0) ? (
                                                        <div>
                                                            <Button variant="success" type="submit">
                                                                Select
                                                            </Button>
                                                            <Button variant="danger" onClick={() => {
                                                                setUpdate((prevState) => !prevState)
                                                            }}>
                                                                Reset
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <></>
                                                    ) : (
                                                        <></>
                                                    )
                                            ) : (
                                                <></>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            }
                            <div className='legend'>
                                <Legend booked={booked} loggedIn={loggedIn} occupied={occupied} selected={selected} totalSeats={totalSeats} numSeats={numSeats} />
                            </div>
                        </Container>

                        {
                            (booked.length > 0 && props.user) &&
                            <div className='p-4'>
                                <ManageReservation type={type} id={props.user.id} setUpdate={setUpdate} setMessage={setMessage} />
                            </div>
                        }
                        {
                            (!mode && booked.length == 0 && !confirm) &&
                            <Manual type={type} totalSeats={totalSeats} setSelected={setSelected} occupied={occupied} numSeats={numSeats} setNumSeats={setNumSeats} />
                        }
                        <div className='mb-3'>
                            <SeatGrid mode={mode} type={type} loggedIn={loggedIn} booked={booked} selected={selected} confirm={confirm} setSelected={setSelected} occupied={occupied} highlight={highlight} />
                        </div>
                    </Form>
                </Container>
            </div>
        </Container>
    );
}
// Switch Auto/Manual Component
function Switch(props) {

    const handleSwitchToggle = () => {
        props.setMode((prevState) => !prevState);
        props.setSelected([]);
        props.setConfirm(false)
        props.setNumSeats(0);
    };

    return (
        <div>
            <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" role="switch" onClick={handleSwitchToggle} id="flexSwitchCheckDefault" />
                <label className="form-check-label" htmlFor="flexSwitchCheckDefault" >{!props.mode?"System mode":"Click mode"}</label>
            </div>
        </div>
    )
}
//Manual Booking Component
function Manual(props) {

    const { type, totalSeats, setSelected, occupied, numSeats, setNumSeats } = props;

    useEffect(() => {
        let seats = numSeats;
        const rows = type === '1' ? 15 : type === '2' ? 20 : 25;
        const columns = type === '1' ? 4 : type === '2' ? 5 : 6;
        setSelected([])
        for (let row = 1; row <= rows && seats > 0; row++) {
            for (let column = 1; column <= columns && seats > 0; column++) {
                const seat = `${row}${String.fromCharCode(64 + column)}`;
                if (!occupied.includes(seat)) {
                    setSelected((prevSelected) => [...prevSelected, seat]);
                    seats--;
                }
            }
        }
    }, [type, totalSeats, setSelected, occupied, numSeats]);

    return (
        <div>
            <Form.Group className="text-center manual-form" >
                <Form.Label>How many seats would you like to book?</Form.Label>
                <Form.Control
                    type="number"

                    min={0}
                    max={totalSeats - occupied.length}
                    required={true}
                    value={numSeats}
                    onChange={(event) => setNumSeats(event.target.value)}
                ></Form.Control>
            </Form.Group>
        </div>
    );
}
// Grid Component
function SeatGrid(props) {

    const type = props.type;
    const rows = type === '1' ? 15 : type === '2' ? 20 : 25;
    const columns = type === '1' ? 4 : type === '2' ? 5 : 6;

    const selected = props.selected;
    const setSelected = props.setSelected;
    const occupied = props.occupied;
    const highlight = props.highlight;
    const booked = props.booked;
    const confirm = props.confirm

    const handleSeatClick = (seat) => {
        if (!occupied.includes(seat)) {
            setSelected((prevSelected) => {
                if (prevSelected.includes(seat)) {
                    return prevSelected.filter((s) => s !== seat);
                } else {
                    return [...prevSelected, seat];
                }
            });
        }
    };

    const allSeats = [];
    for (let row = 1; row <= rows; row++) {
        const rowSeats = [];
        for (let column = 1; column <= columns; column++) {
            const seat = `${row}${String.fromCharCode(64 + column)}`;
            const isSelected = selected.includes(seat);
            const isOccupied = occupied.includes(seat);
            const isHighlighted = highlight.includes(seat);
            const isBooked = booked.includes(seat);
            rowSeats.push(
                <Seat
                    key={column}
                    seat={seat}
                    isSelected={isSelected}
                    isOccupied={isOccupied}
                    isBooked={isBooked}
                    booked={booked}
                    confirm={confirm}
                    isHighlighted={isHighlighted}
                    loggedIn={props.loggedIn}
                    mode={props.mode}
                    onClick={() => handleSeatClick(seat)}
                />
            );
        }

        allSeats.push(<Row key={row}>{rowSeats}</Row>);
    }

    return <div className={`seat-grid-${type} card d-flex align-items-center`} >{allSeats}</div>;


}
// Seat Component
function Seat(props) {
    const seatStatusClass = props.isHighlighted ? 'btn-warning' : props.isBooked ? 'btn-success' : props.isOccupied ? 'btn-danger' : props.isSelected ? 'btn-success' : '';
    const loggedIn = props.loggedIn;
    const onClick = props.onClick;
    const seat = props.seat;
    const mode = props.mode;
    return (
        <Col>
            <Button className={`btn-squared ${seatStatusClass}`} disabled={props.isHighlighted || props.confirm || !mode || props.isOccupied || !loggedIn || props.booked.length > 0} onClick={onClick}>
                {seat}
            </Button>
        </Col>
    );
};
// Legend Component
function Legend(props) {

    const occupiedSeats = props.occupied.length;
    const selectedSeats = props.numSeats !== 0 ? props.numSeats : props.selected.length;
    const availableSeats = props.totalSeats - occupiedSeats - selectedSeats;
    const loggedIn = props.loggedIn;
    const booked = props.booked.length;

    return (
        <div>
            <div>
                <span >Total Seats: </span>
                <span>{props.totalSeats}</span>
            </div>
            <div>
                <span style={{ color: 'blue' }}>Available Seats: </span>
                <span>{availableSeats > 0 ? availableSeats : 0}</span>
            </div>
            <div>
                <span style={{ color: 'red' }}>Occupied Seats: </span>
                <span>{occupiedSeats}</span>
            </div>
            {
                (loggedIn && booked == 0) &&
                <div>
                    <span style={{ color: 'green' }}>Requested Seats: </span>
                    <span>{selectedSeats}</span>
                </div>
            }
            {
                (loggedIn && booked > 0) &&
                <div>
                    <span style={{ color: 'green' }}>Your Seats: </span>
                    <span>{booked}</span>
                </div>
            }
        </div>
    );
};
// Management Component
function ManageReservation(props) {
    return (
        <Container className="d-flex justify-content-center" >
            <div className="col text-center">
                <div className="text-center">Would you like to cancel this reservation?</div>
                <div className="row-2 d-flex justify-content-center">
                    <div className="btn btn-danger" onClick={async () => {
                        await API.deleteReservation(props.type, props.id).then(() => {
                            props.setUpdate((prevState) => !prevState)
                            props.setMessage({ msg: `Your reservation has been canceled successfully.`, type: 'success' });
                        }).catch(err => { throw err })
                    }}>
                        Cancel Reservation
                    </div>
                </div>
            </div>
        </Container>
    );
}

export default PlaneOverview;
