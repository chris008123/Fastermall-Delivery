import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Package,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react-native';

import { useJobsStore, pipelineFor } from '@/src/stores/jobsStore';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme/colors';
import type {
  FailureReason,
  JobStage,
} from '@/src/types/job';
import { formatCurrency } from '@/src/utils/money';
import { FailedDeliverySheet } from '@/src/shared/components/FailedDeliverySheet';
import { SafetySheet } from '@/src/shared/components/SafetySheet';

const STAGE_COPY: Record<
  JobStage,
  {
    title: string;
    description: string;
    action?: string;
  }
> = {
  AVAILABLE: {
    title: 'Delivery available',
    description: 'This delivery is waiting to be accepted.',
    action: 'Accept delivery',
  },

  ACCEPTED: {
    title: 'Job accepted',
    description: 'Start heading to the pickup point.',
    action: 'Start delivery',
  },

  EN_ROUTE_TO_PICKUP: {
    title: 'Heading to pickup',
    description: 'Go to the pickup point and collect the order.',
    action: "I've arrived at pickup",
  },

  PAY_VENDOR: {
    title: 'Pay the vendor',
    description:
      'Pay the vendor for the order, then collect the food.',
    action: 'Mark as paid',
  },

  PICKED_UP: {
    title: 'Order collected',
    description:
      'The order has been collected. Continue to the customer.',
    action: 'Start heading to customer',
  },

  EN_ROUTE_TO_CUSTOMER: {
    title: 'Heading to customer',
    description:
      'Take the order to the customer drop-off point.',
    action: "I've arrived at drop-off",
  },

  DELIVERED: {
    title: 'Handover recorded',
    description:
      'The backend has recorded this delivery as delivered.',
    action: 'Finish delivery',
  },

  COMPLETED: {
    title: 'Delivery completed',
    description:
      'This delivery has been successfully completed.',
  },

  FAILED: {
    title: 'Delivery failed',
    description:
      'This delivery was marked as failed.',
  },
};

function getTypeLabel(type: string) {
  switch (type) {
    case 'FOOD':
      return 'Food';

    case 'LAUNDRY':
      return 'Laundry';

    case 'MARKETPLACE':
      return 'Marketplace';

    default:
      return 'Delivery';
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'FOOD':
      return Store;

    case 'LAUNDRY':
      return Package;

    case 'MARKETPLACE':
    default:
      return Package;
  }
}

function getFailureLabel(reason: FailureReason) {
  switch (reason) {
    case 'CUSTOMER_NOT_ANSWERING':
      return 'Customer not answering';

    case 'WRONG_ADDRESS':
      return 'Wrong address';

    case 'CUSTOMER_REFUSED':
      return 'Customer refused delivery';

    case 'VEHICLE_PROBLEM':
      return 'Vehicle problem';

    case 'VENDOR_ISSUE':
      return 'Vendor issue';

    case 'OTHER':
      return 'Other';

    default:
      return reason;
  }
}

function StepIndicator({
  stage,
  stages,
  theme,
}: {
  stage: JobStage;
  stages: JobStage[];
  theme: typeof colors.light;
}) {
  const currentIndex = stages.indexOf(stage);

  return (
    <View style={styles.stepContainer}>
      {stages.map((item, index) => {
        const completed =
          currentIndex > index ||
          stage === 'COMPLETED';

        const current =
          item === stage;

        const isLast =
          index === stages.length - 1;

        return (
          <View
            key={item}
            style={styles.stepItem}
          >
            <View style={styles.stepIndicatorColumn}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor:
                      completed || current
                        ? theme.primary
                        : theme.background,
                    borderColor:
                      completed || current
                        ? theme.primary
                        : theme.border,
                  },
                ]}
              >
                {completed ? (
                  <CheckCircle2
                    size={15}
                    color="#FFFFFF"
                  />
                ) : (
                  <View
                    style={[
                      styles.stepInnerDot,
                      {
                        backgroundColor:
                          current
                            ? '#FFFFFF'
                            : theme.mutedText,
                      },
                    ]}
                  />
                )}
              </View>

              {!isLast && (
                <View
                  style={[
                    styles.stepLine,
                    {
                      backgroundColor:
                        currentIndex > index
                          ? theme.primary
                          : theme.border,
                    },
                  ]}
                />
              )}
            </View>

            <View
              style={[
                styles.stepTextContainer,
                !isLast && {
                  paddingBottom: 16,
                },
              ]}
            >
              <Text
                style={[
                  styles.stepTitle,
                  {
                    color: current
                      ? theme.text
                      : theme.mutedText,
                    fontWeight: current
                      ? '800'
                      : '600',
                  },
                ]}
              >
                {STAGE_COPY[item].title}
              </Text>

              {current && (
                <Text
                  style={[
                    styles.stepDescription,
                    { color: theme.mutedText },
                  ]}
                >
                  {STAGE_COPY[item].description}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function ActiveDeliveryScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const job = useJobsStore((state) =>
    state.jobs.find((item) => item.id === id),
  );

  const advanceStage = useJobsStore(
    (state) => state.advanceStage,
  );

  const failJob = useJobsStore(
    (state) => state.failJob,
  );

  const loadJobs = useJobsStore(
    (state) => state.loadJobs,
  );

  const [isAdvancing, setIsAdvancing] =
    useState(false);

  const [isFailing, setIsFailing] =
    useState(false);

  const [showSafety, setShowSafety] =
    useState(false);

  const [showFailureSheet, setShowFailureSheet] =
    useState(false);

  const [screenError, setScreenError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!job && id) {
      void loadJobs();
    }
  }, [job, id, loadJobs]);

  const stages = useMemo(() => {
    if (!job) {
      return [];
    }

    return pipelineFor(job.type);
  }, [job]);

  if (!job) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.primary}
        />

        <Text
          style={[
            styles.loadingText,
            { color: theme.mutedText },
          ]}
        >
          Loading delivery...
        </Text>
      </View>
    );
  }

  const copy = STAGE_COPY[job.stage];

  const TypeIcon = getTypeIcon(job.type);

  const isFinished =
    job.stage === 'COMPLETED' ||
    job.stage === 'FAILED';

  const handleAdvance = async () => {
    if (
      isAdvancing ||
      isFinished ||
      !copy.action
    ) {
      return;
    }

    setScreenError(null);
    setIsAdvancing(true);

    try {
      await advanceStage(job.id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update this delivery.';

      setScreenError(message);

      Alert.alert(
        'Unable to update delivery',
        message,
      );
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleFailure = async (
    reason: FailureReason,
  ) => {
    if (isFailing || isFinished) {
      return;
    }

    setShowFailureSheet(false);
    setScreenError(null);
    setIsFailing(true);

    try {
      await failJob(job.id, reason);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to mark this delivery as failed.';

      setScreenError(message);

      Alert.alert(
        'Unable to update delivery',
        message,
      );
    } finally {
      setIsFailing(false);
    }
  };

  if (job.stage === 'COMPLETED') {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={
            styles.completedContent
          }
        >
          <View
            style={[
              styles.successIcon,
              {
                backgroundColor: theme.primary,
              },
            ]}
          >
            <CheckCircle2
              size={48}
              color="#FFFFFF"
            />
          </View>

          <Text
            style={[
              styles.completedTitle,
              { color: theme.text },
            ]}
          >
            Delivery completed
          </Text>

          <Text
            style={[
              styles.completedDescription,
              { color: theme.mutedText },
            ]}
          >
            The delivery has been recorded
            successfully.
          </Text>

          <View
            style={[
              styles.earningCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.earningLabel,
                { color: theme.mutedText },
              ]}
            >
              DELIVERY EARNING
            </Text>

            <Text
              style={[
                styles.earningAmount,
                { color: theme.primary },
              ]}
            >
              {formatCurrency(job.deliveryFee)}
            </Text>

            <Text
              style={[
                styles.earningNote,
                { color: theme.mutedText },
              ]}
            >
              The backend records the delivery
              earning when the delivery reaches
              the delivered state.
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Package
                size={19}
                color={theme.mutedText}
              />

              <View style={styles.summaryInfo}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: theme.mutedText },
                  ]}
                >
                  DELIVERY TYPE
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    { color: theme.text },
                  ]}
                >
                  {getTypeLabel(job.type)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.summaryDivider,
                {
                  backgroundColor: theme.border,
                },
              ]}
            />

            <View style={styles.summaryRow}>
              <UserRound
                size={19}
                color={theme.mutedText}
              />

              <View style={styles.summaryInfo}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: theme.mutedText },
                  ]}
                >
                  CUSTOMER
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    { color: theme.text },
                  ]}
                >
                  {job.customerName}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() =>
              router.replace('/(partner)')
            }
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Back to dashboard
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (job.stage === 'FAILED') {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={
            styles.completedContent
          }
        >
          <View
            style={[
              styles.failureIcon,
              {
                backgroundColor: theme.danger,
              },
            ]}
          >
            <CircleAlert
              size={46}
              color="#FFFFFF"
            />
          </View>

          <Text
            style={[
              styles.completedTitle,
              { color: theme.text },
            ]}
          >
            Delivery failed
          </Text>

          <Text
            style={[
              styles.completedDescription,
              { color: theme.mutedText },
            ]}
          >
            This delivery has been marked as
            failed.
          </Text>

          {job.failureReason && (
            <View
              style={[
                styles.failureReasonCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.failureReasonLabel,
                  { color: theme.mutedText },
                ]}
              >
                REASON
              </Text>

              <Text
                style={[
                  styles.failureReasonValue,
                  { color: theme.text },
                ]}
              >
                {getFailureLabel(
                  job.failureReason,
                )}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.infoTitle,
                { color: theme.text },
              ]}
            >
              What happens next?
            </Text>

            <Text
              style={[
                styles.infoText,
                { color: theme.mutedText },
              ]}
            >
              The delivery has been recorded as
              failed on the backend. Contact support
              if you need assistance with this job.
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.replace('/(partner)')
            }
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Back to dashboard
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <ArrowLeft
            size={20}
            color={theme.text}
          />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text },
            ]}
          >
            Active delivery
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.mutedText },
            ]}
          >
            {getTypeLabel(job.type)}
          </Text>
        </View>

        <Pressable
          onPress={() => setShowSafety(true)}
          style={[
            styles.safetyButton,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <ShieldCheck
            size={19}
            color={theme.text}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor: theme.background,
              },
            ]}
          >
            <TypeIcon
              size={24}
              color={theme.primary}
            />
          </View>

          <View style={styles.statusInfo}>
            <Text
              style={[
                styles.statusTitle,
                { color: theme.text },
              ]}
            >
              {copy.title}
            </Text>

            <Text
              style={[
                styles.statusDescription,
                { color: theme.mutedText },
              ]}
            >
              {copy.description}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.routeCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text },
            ]}
          >
            Delivery route
          </Text>

          <View style={styles.locationRow}>
            <View
              style={[
                styles.locationDot,
                {
                  backgroundColor:
                    theme.primary,
                },
              ]}
            />

            <View style={styles.locationInfo}>
              <Text
                style={[
                  styles.locationLabel,
                  { color: theme.mutedText },
                ]}
              >
                PICKUP
              </Text>

              <Text
                style={[
                  styles.locationValue,
                  { color: theme.text },
                ]}
              >
                {job.pickup.label}
              </Text>

              <Text
                style={[
                  styles.locationSub,
                  { color: theme.mutedText },
                ]}
              >
                {job.pickup.sub}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.locationLine,
              {
                backgroundColor: theme.border,
              },
            ]}
          />

          <View style={styles.locationRow}>
            <View
              style={[
                styles.locationDot,
                {
                  backgroundColor: theme.text,
                },
              ]}
            />

            <View style={styles.locationInfo}>
              <Text
                style={[
                  styles.locationLabel,
                  { color: theme.mutedText },
                ]}
              >
                DROP-OFF
              </Text>

              <Text
                style={[
                  styles.locationValue,
                  { color: theme.text },
                ]}
              >
                {job.dropoff.label}
              </Text>

              <Text
                style={[
                  styles.locationSub,
                  { color: theme.mutedText },
                ]}
              >
                {job.dropoff.sub}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.orderCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text },
            ]}
          >
            Order details
          </Text>

          <View style={styles.orderRow}>
            <Package
              size={19}
              color={theme.mutedText}
            />

            <View style={styles.orderInfo}>
              <Text
                style={[
                  styles.orderLabel,
                  { color: theme.mutedText },
                ]}
              >
                ITEMS
              </Text>

              <Text
                style={[
                  styles.orderValue,
                  { color: theme.text },
                ]}
              >
                {job.itemsSummary}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.orderDivider,
              {
                backgroundColor: theme.border,
              },
            ]}
          />

          <View style={styles.orderRow}>
            <UserRound
              size={19}
              color={theme.mutedText}
            />

            <View style={styles.orderInfo}>
              <Text
                style={[
                  styles.orderLabel,
                  { color: theme.mutedText },
                ]}
              >
                CUSTOMER
              </Text>

              <Text
                style={[
                  styles.orderValue,
                  { color: theme.text },
                ]}
              >
                {job.customerName}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.orderDivider,
              {
                backgroundColor: theme.border,
              },
            ]}
          />

          <View style={styles.orderRow}>
            <Clock3
              size={19}
              color={theme.mutedText}
            />

            <View style={styles.orderInfo}>
              <Text
                style={[
                  styles.orderLabel,
                  { color: theme.mutedText },
                ]}
              >
                DELIVERY MODE
              </Text>

              <Text
                style={[
                  styles.orderValue,
                  { color: theme.text },
                ]}
              >
                {job.partnerMode === 'MOTORCYCLE'
                  ? 'Motorcycle'
                  : 'Walking'}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text },
            ]}
          >
            Progress
          </Text>

          <StepIndicator
            stage={job.stage}
            stages={stages}
            theme={theme}
          />
        </View>

        {screenError && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.danger,
              },
            ]}
          >
            <CircleAlert
              size={19}
              color={theme.danger}
            />

            <View style={styles.errorInfo}>
              <Text
                style={[
                  styles.errorTitle,
                  { color: theme.danger },
                ]}
              >
                Unable to update delivery
              </Text>

              <Text
                style={[
                  styles.errorText,
                  { color: theme.mutedText },
                ]}
              >
                {screenError}
              </Text>
            </View>
          </View>
        )}

        {copy.action && (
          <Pressable
            disabled={isAdvancing || isFailing}
            onPress={() => void handleAdvance()}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
                opacity:
                  pressed ||
                  isAdvancing ||
                  isFailing
                    ? 0.8
                    : 1,
              },
            ]}
          >
            {isAdvancing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={styles.primaryButtonText}
              >
                {copy.action}
              </Text>
            )}
          </Pressable>
        )}

        {!isFinished && (
          <Pressable
            disabled={isAdvancing || isFailing}
            onPress={() =>
              setShowFailureSheet(true)
            }
            style={[
              styles.failButton,
              {
                borderColor: theme.border,
                opacity:
                  isAdvancing || isFailing
                    ? 0.5
                    : 1,
              },
            ]}
          >
            <CircleAlert
              size={18}
              color={theme.danger}
            />

            <Text
              style={[
                styles.failButtonText,
                { color: theme.danger },
              ]}
            >
              Report delivery problem
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <SafetySheet
        visible={showSafety}
        onClose={() => setShowSafety(false)}
      />

      <FailedDeliverySheet
        visible={showFailureSheet}
        onClose={() =>
          setShowFailureSheet(false)
        }
        onSelectReason={handleFailure}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },

  header: {
    height: 64,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },

  safetyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 120,
  },

  statusCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },

  statusTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  statusDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  routeCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    marginTop: 14,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 18,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  locationDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: 4,
  },

  locationInfo: {
    flex: 1,
    marginLeft: 11,
  },

  locationLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  locationValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },

  locationSub: {
    fontSize: 12,
    marginTop: 3,
  },

  locationLine: {
    width: 1,
    height: 30,
    marginLeft: 5,
    marginVertical: 3,
  },

  orderCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    marginTop: 14,
  },

  orderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  orderInfo: {
    flex: 1,
    marginLeft: 11,
  },

  orderLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  orderValue: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 4,
  },

  orderDivider: {
    height: 1,
    marginVertical: 14,
  },

  progressCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    marginTop: 14,
  },

  stepContainer: {
    marginTop: 2,
  },

  stepItem: {
    flexDirection: 'row',
  },

  stepIndicatorColumn: {
    width: 24,
    alignItems: 'center',
  },

  stepCircle: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 2,
  },

  stepTextContainer: {
    flex: 1,
    marginLeft: 10,
  },

  stepTitle: {
    fontSize: 13,
    lineHeight: 21,
  },

  stepDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  errorCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  errorInfo: {
    flex: 1,
    marginLeft: 10,
  },

  errorTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  errorText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 15,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  failButton: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  failButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },

  completedContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 100,
  },

  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  failureIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  completedTitle: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 20,
  },

  completedDescription: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
    marginTop: 7,
  },

  earningCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginTop: 28,
  },

  earningLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  earningAmount: {
    fontSize: 30,
    fontWeight: '900',
    marginTop: 5,
  },

  earningNote: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },

  summaryCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    marginTop: 14,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  summaryInfo: {
    flex: 1,
    marginLeft: 11,
  },

  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },

  summaryDivider: {
    height: 1,
    marginVertical: 14,
  },

  failureReasonCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    marginTop: 28,
  },

  failureReasonLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  failureReasonValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 5,
  },

  infoCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    marginTop: 14,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  infoText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
});
