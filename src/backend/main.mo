import Array "mo:base/Array";
import Time "mo:base/Time";

actor {
  public type LeaderboardEntry = {
    rank : Nat;
    name : Text;
    timeMs : Nat;
    timestamp : Int;
  };

  private type StoredEntry = {
    name : Text;
    timeMs : Nat;
    timestamp : Int;
  };

  stable var entries : [StoredEntry] = [];

  // Submit a lap time. Keeps only top 10 globally (fastest times).
  public func submitLapTime(name : Text, timeMs : Nat) : async Bool {
    let newEntry : StoredEntry = {
      name = name;
      timeMs = timeMs;
      timestamp = Time.now();
    };

    // Append new entry using dot notation
    let extended = entries.concat([newEntry]);

    // Sort by timeMs ascending using dot notation
    let sorted = extended.sort(func(a : StoredEntry, b : StoredEntry) : { #less; #equal; #greater } {
      if (a.timeMs < b.timeMs) { #less }
      else if (a.timeMs > b.timeMs) { #greater }
      else { #equal }
    });

    // Keep top 10
    entries := if (sorted.size() > 10) {
      Array.tabulate(10, func(i : Nat) : StoredEntry { sorted[i] })
    } else {
      sorted
    };

    return true;
  };

  // Get the current leaderboard (top 10, sorted fastest first)
  public query func getLeaderboard() : async [LeaderboardEntry] {
    Array.tabulate(entries.size(), func(i : Nat) : LeaderboardEntry {
      {
        rank = i + 1;
        name = entries[i].name;
        timeMs = entries[i].timeMs;
        timestamp = entries[i].timestamp;
      }
    })
  };
}
