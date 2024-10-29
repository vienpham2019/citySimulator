import InstanceMesh from "./InstanceMesh.js";

export default class NodeInstance extends InstanceMesh {
  constructor({ maxInstance }) {
    super();
    this.maxInstance = maxInstance;
    this.scale = { x: 1, y: 1, z: 1 };
    this.avaliableIndexs = [[0, maxInstance]];
  }

  removeAvaliableIndex(takenNumber) {
    const updatedGaps = [];
    let numberTaken = false;

    for (const [start, end] of this.avaliableIndexs) {
      // If the taken number is less than the start of the current gap
      if (takenNumber < start) {
        // If the number hasn't been added yet, add it as a gap
        if (!numberTaken) {
          updatedGaps.push([takenNumber, takenNumber]);
          numberTaken = true; // Mark that we've added the taken number
        }
        updatedGaps.push([start, end]); // Push the current gap
      }
      // If the taken number is within the current gap
      else if (takenNumber >= start && takenNumber <= end) {
        // If the taken number is greater than the start, we add the left side gap
        if (takenNumber > start) {
          updatedGaps.push([start, takenNumber - 1]);
        }
        // Add a gap after the taken number if there's space
        if (takenNumber < end) {
          updatedGaps.push([takenNumber + 1, end]);
        }
        numberTaken = true; // Mark that we've processed the taken number
      }
      // If the taken number is greater than the end of the current gap
      else {
        updatedGaps.push([start, end]); // Just push the current gap
      }
    }

    // If the taken number hasn't been added yet, add it at the end
    if (!numberTaken) {
      updatedGaps.push([takenNumber, takenNumber]);
    }
    this.avaliableIndexs = updatedGaps;
  }

  addAvaliableIndex(numberToAdd) {
    const updatedGaps = [];
    let numberAdded = false;

    for (let i = 0; i < this.avaliableIndexs.length; i++) {
      const [start, end] = this.avaliableIndexs[i];

      if (numberToAdd < start - 1) {
        // If the number is before this gap and no merge is needed, add it as a new gap
        if (!numberAdded) {
          updatedGaps.push([numberToAdd, numberToAdd]);
          numberAdded = true;
        }
        updatedGaps.push([start, end]);
      } else if (numberToAdd === start - 1) {
        // If the number directly extends the start of this gap, merge it
        updatedGaps.push([numberToAdd, end]);
        numberAdded = true;
      } else if (numberToAdd >= start && numberToAdd <= end) {
        // If the number is already within this gap, no need to add it
        updatedGaps.push([start, end]);
        numberAdded = true;
      } else if (numberToAdd === end + 1) {
        // If the number extends the end of this gap, merge it with this gap
        updatedGaps.push([start, numberToAdd]);
        numberAdded = true;
      } else {
        // Otherwise, just add the current gap
        updatedGaps.push([start, end]);
      }
    }

    // If the number is beyond the last gap and hasn't been added, add it as a new gap
    if (!numberAdded) {
      updatedGaps.push([numberToAdd, numberToAdd]);
    }

    // Now merge any overlapping or adjacent gaps
    const mergedGaps = [];
    let [currentStart, currentEnd] = updatedGaps[0];

    for (let i = 1; i < updatedGaps.length; i++) {
      const [nextStart, nextEnd] = updatedGaps[i];

      if (currentEnd + 1 >= nextStart) {
        // Merge overlapping or adjacent gaps
        currentEnd = Math.max(currentEnd, nextEnd);
      } else {
        // Add the current gap and start a new one
        mergedGaps.push([currentStart, currentEnd]);
        currentStart = nextStart;
        currentEnd = nextEnd;
      }
    }
    mergedGaps.push([currentStart, currentEnd]);
    this.avaliableIndexs = mergedGaps;
  }

  addInstanceToSence({ position, angleRadians = 0 }) {
    const index = this.avaliableIndexs[0][0];
    this.removeAvaliableIndex(index);
    this.updateInstanceMeshPosition({ position, index, angleRadians });
  }

  removeInstanceFromSence({ index }) {
    this.addAvaliableIndex(index);
    this.updateInstanceMeshPosition({
      position: { x: 1e10, y: 1e10, z: 1e10 },
      index,
    });
  }

  updateInstanceMeshPosition({ position, index, angleRadians = 0 }) {
    if (position.z === null || position.z === undefined) {
      position = {
        x: position.x,
        y: 0,
        z: position.y,
      };
    }
    super.updateInstanceMeshPosition({
      position,
      index,
      angleRadians,
    });
  }
}
