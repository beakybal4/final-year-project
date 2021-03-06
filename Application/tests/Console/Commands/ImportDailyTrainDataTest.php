<?php
/**
 * Created by PhpStorm.
 * User: ryan
 * Date: 12/11/15
 * Time: 12:13
 */

namespace App\Console\Commands;


use Carbon\Carbon;
use Exception;

class ImportDailyTrainDataTest extends \TestCase
{
    /**
     * @var MockDailyTrainDataGateway
     */
    private $mockGateway;

    /**
     * @var ImportDailyTrainData
     */
    private $command;

    /**
     * @var MockTrainDataStorage
     */
    private $mockStorage;

    public function setUp()
    {
        parent::setUp();

        $this->mockGateway = new MockDailyTrainDataGateway();
        $this->mockStorage = new MockTrainDataStorage();
        $this->command = new ImportDailyTrainData( $this->mockGateway, $this->mockStorage );
    }

    /**
     * @test
     * @expectedException Exception
     */
    public function givenNullData_WhenParsed_ThenThrowsParserException()
    {
        $this->command->handle();
        $this->assertTrue( $this->mockStorage->isEmpty() );
    }

    /**
     * @test
     * @expectedException Exception
     */
    public function givenNonXMLData_WhenParsed_ThenThrowsParserException()
    {
        $this->mockGateway->setData( 'John Cena' );
        $this->command->handle();
        $this->assertTrue( $this->mockStorage->isEmpty() );
    }

    /**
     * @test
     */
    public function givenSingleJourneyNoStopsInValidXMl_WhenParsed_ThenOneRowInsertedToDb()
    {
        $data =
           '<PportTimetable>
                <Journey rid="1" ssd="'.date("Y-m-d").'" >
                    <OR tpl="START" wtd="16:04" />
                    <DT tpl="END" wta="16:20" />
                </Journey>
            </PportTimetable>';
        $this->mockGateway->setData( $data );
        $this->command->handle();
        $expected = [
            [
                '1',
                'START',
                new Carbon( date('Y-m-d').' 16:04:00' ),
                'END',
                new Carbon( date('Y-m-d').' 16:20:00' )
            ]
        ];
        $this->assertEquals( $expected, $this->mockStorage->getData());
    }

    /**
     * @test
     */
    public function givenSingleJourneyWithPassThroughStop_WhenParsed_ThenTwoRowsInsertedIntoDb()
    {
        $data =
            '<PportTimetable>
                <Journey rid="1" ssd="'.date("Y-m-d").'" >
                    <OR tpl="START" wtd="16:04" />
                    <PP tpl="MIDDLE" wtp="16:10"/>
                    <DT tpl="END" wta="16:20" />
                </Journey>
            </PportTimetable>';
        $this->mockGateway->setData( $data );
        $this->command->handle();
        $expected = [
            [
                '1',
                'START',
                new Carbon( date('Y-m-d').' 16:04:00' ),
                'MIDDLE',
                new Carbon( date('Y-m-d').' 16:10:00' )
            ],
            [
                '1',
                'MIDDLE',
                new Carbon( date('Y-m-d').' 16:10:00' ),
                'END',
                new Carbon( date('Y-m-d').' 16:20:00' )
            ]
        ];
        $this->assertEquals( $expected, $this->mockStorage->getData() );
    }

    /**
     * @test
     */
    public function givenSingleJourneyWithStationStop_WhenParsed_ThenTwoRowsWithCorrectTimesInserted()
    {
        $data =
            '<PportTimetable>
                <Journey rid="1" ssd="'.date("Y-m-d").'" >
                    <OR tpl="START" wtd="16:04" />
                    <IP tpl="MIDDLE" wta="16:10" wtd="16:12" />
                    <DT tpl="END" wta="16:20" />
                </Journey>
            </PportTimetable>';
        $this->mockGateway->setData( $data );
        $this->command->handle();
        $expected = [
            [
                '1',
                'START',
                new Carbon( date('Y-m-d').' 16:04:00' ),
                'MIDDLE',
                new Carbon( date('Y-m-d').' 16:10:00' )
            ],
            [
                '1',
                'MIDDLE',
                new Carbon( date('Y-m-d').' 16:12:00' ),
                'END',
                new Carbon( date('Y-m-d').' 16:20:00' )
            ]
        ];
        $this->assertEquals( $expected, $this->mockStorage->getData());
    }

    /**
     * @test
     */
    public function givenJourneyWithMultipleStopTypes_WhenParsed_ThenAllRowsInserted()
    {
        $data =
            '<PportTimetable>
                <Journey rid="1" ssd="'.date("Y-m-d").'" >
                    <OR tpl="START" wtd="16:04" />
                    <PP tpl="NONSTOP" wtp="16:07" />
                    <IP tpl="MIDDLE" wta="16:10" wtd="16:12" />
                    <PP tpl="NONSTOP2" wtp="16:17" />
                    <IP tpl="MIDDLE2" wta="16:20" wtd="16:22:30" />
                    <DT tpl="END" wta="16:30" />
                </Journey>
            </PportTimetable>';
        $this->mockGateway->setData( $data );
        $this->command->handle();
        $expected = [
            [
                '1',
                'START',
                new Carbon( date('Y-m-d').' 16:04:00' ),
                'NONSTOP',
                new Carbon( date('Y-m-d').' 16:07:00' )
            ],
            [
                '1',
                'NONSTOP',
                new Carbon( date('Y-m-d').' 16:07:00' ),
                'MIDDLE',
                new Carbon( date('Y-m-d').' 16:10:00' )
            ],
            [
                '1',
                'MIDDLE',
                new Carbon( date('Y-m-d').' 16:12:00' ),
                'NONSTOP2',
                new Carbon( date('Y-m-d').' 16:17:00' )
            ],
            [
                '1',
                'NONSTOP2',
                new Carbon( date('Y-m-d').' 16:17:00'),
                'MIDDLE2',
                new Carbon( date('Y-m-d').' 16:20:00' )
            ],
            [
                '1',
                'MIDDLE2',
                new Carbon( date('Y-m-d').' 16:22:30'),
                'END',
                new Carbon( date('Y-m-d').' 16:30:00' )
            ]
        ];
        $this->assertEquals( $expected, $this->mockStorage->getData());
    }

    /**
     * @test
     */
    public function givenMultipleJourneys_WhenParsed_ThenAllJourneysAddedWithCorrectRidsForStops()
    {
        $data =
            '<PportTimetable>
                <Journey rid="1" ssd="'.date("Y-m-d").'" >
                    <OR tpl="START" wtd="16:04" />
                    <PP tpl="NONSTOP" wtp="16:07" />
                    <IP tpl="MIDDLE" wta="16:10" wtd="16:12" />
                    <PP tpl="NONSTOP2" wtp="16:17" />
                    <IP tpl="MIDDLE2" wta="16:20" wtd="16:22:30" />
                    <DT tpl="END" wta="16:30" />
                </Journey>
                <Journey rid="2" ssd="'.date("Y-m-d").'" >
                    <OR tpl="START" wtd="16:04" />
                    <PP tpl="NONSTOP" wtp="16:07" />
                    <IP tpl="MIDDLE" wta="16:10" wtd="16:12" />
                    <PP tpl="NONSTOP2" wtp="16:17" />
                    <IP tpl="MIDDLE2" wta="16:20" wtd="16:22:30" />
                    <DT tpl="END" wta="16:30" />
                </Journey>
            </PportTimetable>';
        $this->mockGateway->setData( $data );
        $this->command->handle();
        $expected = [
            [
                '1',
                'START',
                new Carbon( date('Y-m-d').' 16:04:00'),
                'NONSTOP',
                new Carbon( date('Y-m-d').' 16:07:00')
            ],
            [
                '1',
                'NONSTOP',
                new Carbon( date('Y-m-d').' 16:07:00'),
                'MIDDLE',
                new Carbon( date('Y-m-d').' 16:10:00')
            ],
            [
                '1',
                'MIDDLE',
                new Carbon( date('Y-m-d').' 16:12:00'),
                'NONSTOP2',
                new Carbon( date('Y-m-d').' 16:17:00')
            ],
            [
                '1',
                'NONSTOP2',
                new Carbon( date('Y-m-d').' 16:17:00'),
                'MIDDLE2',
                new Carbon( date('Y-m-d').' 16:20:00' )
            ],
            [
                '1',
                'MIDDLE2',
                new Carbon( date('Y-m-d').' 16:22:30'),
                'END',
                new Carbon( date('Y-m-d').' 16:30:00' )
            ],
            [
                '2',
                'START',
                new Carbon( date('Y-m-d').' 16:04:00'),
                'NONSTOP',
                new Carbon( date('Y-m-d').' 16:07:00' )
            ],
            [
                '2',
                'NONSTOP',
                new Carbon( date('Y-m-d').' 16:07:00'),
                'MIDDLE',
                new Carbon( date('Y-m-d').' 16:10:00' )
            ],
            [
                '2',
                'MIDDLE',
                new Carbon( date('Y-m-d').' 16:12:00'),
                'NONSTOP2',
                new Carbon( date('Y-m-d').' 16:17:00' )
            ],
            [
                2,
                'NONSTOP2',
                new Carbon( date('Y-m-d').' 16:17:00'),
                'MIDDLE2',
                new Carbon( date('Y-m-d').' 16:20:00' )
            ],
            [
                2,
                'MIDDLE2',
                new Carbon( date('Y-m-d').' 16:22:30'),
                'END',
                new Carbon( date('Y-m-d').' 16:30:00' )
            ]
        ];
        $this->assertEquals( $expected, $this->mockStorage->getData());
    }
}