/* eslint no-param-reassign: off */
import React, {useEffect, useMemo, useRef, useState} from "react";
import scrollama from "scrollama";

import story from "../../../data/spotlights/spotlight-1.json";
import Iframe from "../../components/datawrapper";
import Layout from "../../components/layout-spotlights";
import SpotlightChart from "../../components/spotlight-chart";
import ScrollySteps from "../../components/spotlight-steps";
import MyImage from "../../images/spotlights/datawrapper-map-dummy.png";
import {setupSpotlight} from "../../spotlights";

const chartData = [
  {id: "twitter", name: "Twitter", value: 37},
  {id: "ooredo", name: "Ooredo", value: 54},
  {id: "apple", name: "Apple", value: 10},
  {id: "amazon", name: "Amazon", value: 67},
];

const SpotlightOne = () => {
  // We store the current scroll step.
  const [currentStep, setCurrentStep] = useState();
  const scrolly1El = useRef(undefined);
  const scroller1 = useMemo(() => scrollama(), []);

  useEffect(() => {
    // arguments of both call back functions are the arguments of the callback
    // call emitted by the scrollama.onStepEnter/onStepExit callbacks.
    const onStepEnter = ({index, direction}) => {
      // we set the current active step. Scrollama indices are 1 based, we adopt
      // a 0 based index for the current step.
      setCurrentStep(index - 1);
      console.log("Entering a step.", index, direction);
    };

    const onStepExit = ({index, direction}) => {
      console.log("Exiting a step.", index, direction);
    };

    const unmount1 = setupSpotlight(
      scrolly1El,
      scroller1,
      "#scrolly-1 .step",
      onStepEnter,
      onStepExit,
    );

    return () => {
      unmount1();
    };
  }, [scroller1, scrolly1El]);

  return (
    <Layout>
      <main className="container mx-auto spotlight">
        <section className="max-w-6xl">
          <h2>Intro (Staging Test)</h2>

          <p>
            Prow scuttle parrel provost Sail ho shrouds spirits boom mizzenmast
            yardarm. Pinnace holystone mizzenmast quarter crows nest nipperkin
            grog yardarm hempen halter furl. Swab barque interloper chantey
            doubloon starboard grog black jack gangway rutters.
          </p>

          <p>
            Deadlights jack lad schooner scallywag dance the hempen jig carouser
            broadside cable strike colors. Bring a spring upon her cable
            holystone blow the man down spanker Shiver me timbers to go on
            account lookout wherry doubloon chase. Belay yo-ho-ho keelhaul
            squiffy black spot yardarm spyglass sheet transom heave to.
          </p>

          <p>
            Trysail Sail ho Corsair red ensign hulk smartly boom jib rum
            gangway. Case shot Shiver me timbers gangplank crack Jennys tea cup
            ballast Blimey lee snow crows nest rutters. Fluke jib scourge of the
            seven seas boatswain schooner gaff booty Jack Tar transom spirits.
          </p>
        </section>

        <section className="max-w-6xl datawrapper-dummy-embed">
          <Iframe
            title="Countries with Facebook's internet.org"
            src="https://datawrapper.dwcdn.net/mcT4c/1/"
            initialHeight={720}
          />
        </section>

        <section className="max-w-6xl">
          <h2>Analysis 1</h2>

          <p>
            Prow scuttle parrel provost Sail ho shrouds spirits boom mizzenmast
            yardarm. Pinnace holystone mizzenmast quarter crows nest nipperkin
            grog yardarm hempen halter furl. Swab barque interloper chantey
            doubloon starboard grog black jack gangway rutters.
          </p>

          <p>
            Deadlights jack lad schooner scallywag dance the hempen jig carouser
            broadside cable strike colors. Bring a spring upon her cable
            holystone blow the man down spanker Shiver me timbers to go on
            account lookout wherry doubloon chase. Belay yo-ho-ho keelhaul
            squiffy black spot yardarm spyglass sheet transom heave to.
          </p>

          <p>
            Trysail Sail ho Corsair red ensign hulk smartly boom jib rum
            gangway. Case shot Shiver me timbers gangplank crack Jennys tea cup
            ballast Blimey lee snow crows nest rutters. Fluke jib scourge of the
            seven seas boatswain schooner gaff booty Jack Tar transom spirits.
          </p>
        </section>

        <section id="scrolly-1" ref={scrolly1El} className="scrolly">
          <h2>Scrolly 1</h2>

          <div id="scrolly-canvas" className="scrolly-canvas">
            <figure className="scrolly-figure bg-gray-200">
              <p id="scene-counter">
                <SpotlightChart data={chartData} highlightedBar={currentStep} />
              </p>
              <p id="index-counter">Off</p>
            </figure>
          </div>

          <ScrollySteps story={story} />
        </section>

        <section id="analysis-3" className="max-w-6xl">
          <h2>Analysis 3</h2>

          <p>
            Prow scuttle parrel provost Sail ho shrouds spirits boom mizzenmast
            yardarm. Pinnace holystone mizzenmast quarter crows nest nipperkin
            grog yardarm hempen halter furl. Swab barque interloper chantey
            doubloon starboard grog black jack gangway rutters.
          </p>

          <figure>
            <img src={MyImage} alt="Some other data stuff" />
            <figcaption>Caption: Example PNG Image</figcaption>
          </figure>

          <p>
            Deadlights jack lad schooner scallywag dance the hempen jig carouser
            broadside cable strike colors. Bring a spring upon her cable
            holystone blow the man down spanker Shiver me timbers to go on
            account lookout wherry doubloon chase. Belay yo-ho-ho keelhaul
            squiffy black spot yardarm spyglass sheet transom heave to.
          </p>

          <p>
            Trysail Sail ho Corsair red ensign hulk smartly boom jib rum
            gangway. Case shot Shiver me timbers gangplank crack Jennys tea cup
            ballast Blimey lee snow crows nest rutters. Fluke jib scourge of the
            seven seas boatswain schooner gaff booty Jack Tar transom spirits.
          </p>
        </section>

        <section id="outro" className="max-w-6xl">
          <h2>Outro</h2>

          <p>
            Prow scuttle parrel provost Sail ho shrouds spirits boom mizzenmast
            yardarm. Pinnace holystone mizzenmast quarter crows nest nipperkin
            grog yardarm hempen halter furl. Swab barque interloper chantey
            doubloon starboard grog black jack gangway rutters.
          </p>

          <p>
            Deadlights jack lad schooner scallywag dance the hempen jig carouser
            broadside cable strike colors. Bring a spring upon her cable
            holystone blow the man down spanker Shiver me timbers to go on
            account lookout wherry doubloon chase. Belay yo-ho-ho keelhaul
            squiffy black spot yardarm spyglass sheet transom heave to.
          </p>

          <p>
            Trysail Sail ho Corsair red ensign hulk smartly boom jib rum
            gangway. Case shot Shiver me timbers gangplank crack Jennys tea cup
            ballast Blimey lee snow crows nest rutters. Fluke jib scourge of the
            seven seas boatswain schooner gaff booty Jack Tar transom spirits.
          </p>
        </section>
      </main>
    </Layout>
  );
};

export default SpotlightOne;
