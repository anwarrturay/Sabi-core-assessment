import StudyScreener from './StudyScreener'
import studies from './studies.mock.json';
import type { Study } from './Types/general';

const mockStudies = studies as Study[];
const App = () => {
  return (
    <StudyScreener studies={mockStudies} />
  )
}

export default App