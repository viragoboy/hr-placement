function groupApplicationsByLocationAndStatus(rows, selectedSchool, selectedStatus) {
  return rows.reduce((acc, item) => {
    const preferredLocation = item.preferredLocationName || 'No Preferred Location';
    const status = item.locationStatus || 'Unknown Status';
    const schoolMatches = !selectedSchool || preferredLocation === selectedSchool;
    const statusMatches = !selectedStatus || status === selectedStatus;

    if (!schoolMatches || !statusMatches) {
      return acc;
    }

    if (!acc[preferredLocation]) acc[preferredLocation] = {};
    if (!acc[preferredLocation][status]) acc[preferredLocation][status] = [];
    acc[preferredLocation][status].push(item);
    return acc;
  }, {});
}

module.exports = { groupApplicationsByLocationAndStatus };
