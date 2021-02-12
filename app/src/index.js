import React, { useState, useEffect, } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Person from './Person';
import Bill from './Bill';
import Committee from './Committee';
import Subject from './Subject';
import Logo from "./JUN20-MSS-Logo-Banner.png"
import Airtable  from 'airtable'
import { MdEmail } from 'react-icons/md';
import { updateBillStatus } from './utilities'
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

function Wrapper() {
  const scrapedData = require('./bills.json')
  scrapedData.bills.forEach(b => updateBillStatus(b))
  
  const base = new Airtable({apiKey: 'keyX0mQVFiAFPITWj'}).base('apphXzpbYfgPql6dw');
  const [loaded, setLoaded] = useState(false)

  const joinAirtable = async () => {
    return Promise.all([
      new Promise(function(resolve, reject) { 
        let billNames = []
        base('FOLLOWING').select({
          view: "Grid view"
        }).eachPage(function page(records, fetchNextPage) {
          records.forEach(function(record) {
            billNames.push({
              name: record.get('Bill'),
              notes: record.get('Notes'),
              tags: record.get('Tags')
            })
          });
          fetchNextPage();
        }, function done(err) {
          resolve(billNames)
        });
      }),
      new Promise(function(resolve, reject) { 
        let dispatches = []
        base('DISPATCHES').select({
          view: "Grid view"
        }).eachPage(function page(records, fetchNextPage) {
          records.forEach(function(record) {
            dispatches.push({
              bill: record.get('Bill'),
              date: record.get('Date'),
              tag: record.get('Tag'),
              reporter: record.get('Reporter'),
              source: record.get('Source'),
              content: record.get('Content'),
            })
          });
          fetchNextPage();
        }, function done(err) {
          resolve(dispatches)
        });
      })
    ])
  }

  useEffect(async () => {
    const scrapedLegislators = require('./legislators.json')
    scrapedData.people.forEach(person => {
      Object.assign(person, scrapedLegislators[person.name])
    })
    const output = await joinAirtable()
    output[0].forEach((billData, idx) => {
      scrapedData.bills.forEach(bill => {
        if (billData.name == bill.name) {
          bill.followingIdx = idx
          bill.notes = billData.notes
          bill.tags = billData.tags
        }
      })
    })
    output[1].forEach((dispatch) => {
      scrapedData.bills.forEach(bill => {
        if (dispatch.bill == bill.name) {
          if (!bill.dispatches) {
            bill.dispatches = [dispatch]
          } else {
            bill.dispatches.push(dispatch)
          }
        }
      })
    })
  
    setLoaded(true)
  }, []);

  return (
    <Router>
      <div className="Header">
        <div className="Header-nav">
          <a href="https://mountainstatespotlight.org"><img className="Header-logo" src={Logo} /></a>
          <a className="Header-nav-button" href="/">Home</a>
          <a className="Header-nav-button" href="https://mountainstatespotlight.org/category/legislature/">Latest News</a>
          <a className="Header-nav-button" href="https://mountainstatespotlight.org/2021/02/14/introducing-mountain-state-spotlights-legislature-tracker">About</a>
        </div>
        <a className="Header-social" href="https://mountainstatespotlight.org/newsletter-sign-up/"><MdEmail /> SIGN UP</a>
        <a className="Header-button" href="https://checkout.fundjournalism.org/memberform?org_id=mountainstatespotlight&campaign=7014W000001diQiQAI" target="_blank">Donate</a>
      </div>
      <Switch>
        <Route exact path="/">
          <App scrapedData={scrapedData} loaded={loaded} />
        </Route>
        <Route path="/bill/:name">
          <Bill scrapedData={scrapedData} loaded={loaded} />
        </Route>
        <Route path="/person/:name">
          <Person scrapedData={scrapedData} loaded={loaded} />
        </Route>
        <Route path="/subject/:name">
          <Subject scrapedData={scrapedData} loaded={loaded} />
        </Route>
        <Route path="/committee/:chamber/:name">
          <Committee scrapedData={scrapedData} loaded={loaded} />
        </Route>
      </Switch>
    </Router>
  )
}

ReactDOM.render(
  <div>
    <Wrapper />
  </div>,
  document.getElementById('root')
);

