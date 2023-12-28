import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import airplane1 from '../assets/airplane1.svg';
import airplane2 from '../assets/airplane2.svg';
import airplane3 from '../assets/airplane3.svg';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';

const planesData = [
    {
        type: 'local',
        title: 'LOCAL',
        description: 'Discover your own backyard with our local planes, providing convenient and comfortable travel options for short-distance journeys within your region.',
        image: airplane1,
    },
    {
        type: 'regional',
        title: 'REGIONAL',
        description: 'Experience the beauty of nearby destinations with our regional planes. Offering efficient and reliable flights, these planes connect you to exciting locations just a few hours away.',
        image: airplane2,
    },
    {
        type: 'international',
        title: 'INTERNATIONAL',
        description: 'Embark on unforgettable adventures with our international planes. Explore far-off destinations and immerse yourself in diverse cultures, all while enjoying a seamless and comfortable travel experience.',
        image: airplane3,
    },
];

function HomePage() {
  return (
    <Container className="col d-flex justify-content-center" style={{ width: '100%' }}>
      
      <div className="row ">
      <h1 className="mt-3 text-center text-break">Select a plane to check availability:</h1>
        {planesData.map((plane) => (
          <Container key={plane.type} className="col-3">
            <div className="row below-nav" key={plane.type}>
              <Link to={`/planes/${plane.type}`}>
                <img src={plane.image} className="row-1" style={{ backgroundColor: 'transparent', width: '100%' }} />
              </Link>
              <div className="row-2 d-flex flex-column align-items-center justify-content-center" style={{ height: '100%' }}>
                <h3 className="text-center">{plane.title}</h3>
                <div className="description-box">
                  <p className="text-center text-break">{plane.description}</p>
                </div>
              </div>
            </div>
          </Container>
        ))}
      </div>
    </Container>
  );
}
export default HomePage;
